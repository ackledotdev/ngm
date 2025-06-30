import { Argv } from 'yargs';
import { stdoutWarnLn, stdoutWritePlainLn } from '../stdio';
import { listRepos } from '../datalib';
import chalk from 'chalk';
import {
	validatePhysicalRepoExistence,
	PhysicalRepoValidationError,
} from '../dataschemas';
import { GitProcess } from 'dugite';

export const command = 'pull';
export const desc = 'Pull all registered local Git repositories';

export const builder = (y: Argv) =>
	y
		.option('exclude', {
			alias: 'e',
			type: 'string',
			description:
				'Repository nickname to exclude (can be used multiple times)',
			demandOption: false,
		})
		.example(
			'$0 pull --exclude repo1 --exclude repo2',
			'Pull changes for all registered repositories except repo1 and repo2'
		);

export const handler = async () => {
	stdoutWritePlainLn("Running 'git pull' on all registered repositories...");

	const repos = await listRepos();

	if (repos.length === 0) stdoutWarnLn('No repositories registered yet.');
	else {
		let successCount = 0;
		for (const [id, repo] of repos) {
			const physicalRepoValidationResult = await validatePhysicalRepoExistence(
				repo?.path || ''
			);

			const gitFetchResult =
				physicalRepoValidationResult === true
					? (await GitProcess.exec(['fetch'], repo!.path)).exitCode
					: null;

			const printStr = (() => {
				if (
					physicalRepoValidationResult ===
					PhysicalRepoValidationError.INVALID_PATH
				)
					return `Did not fetch ${id} -> INVALID_PATH "${repo?.path ?? ''}"`;
				else if (
					physicalRepoValidationResult === PhysicalRepoValidationError.NO_GIT
				)
					return `Did not fetch ${id} -> NO_GIT`;
				else if (
					physicalRepoValidationResult === true &&
					gitFetchResult === 0
				) {
					successCount++;
					return `Fetched ${id}`;
				} else if (
					physicalRepoValidationResult === true &&
					gitFetchResult !== 0
				)
					return `Failed to fetch ${id} -> ${repo!.path} ('git fetch' exited with code ${gitFetchResult!})`;
				else return `Action failed on ${id} -> UNKNOWN_ERROR`;
			})();

			stdoutWritePlainLn(
				`[ ${
					physicalRepoValidationResult === true && gitFetchResult === 0
						? chalk.green('✔')
						: chalk.red('✘')
				} ] ${printStr}`
			);
		}
		stdoutWritePlainLn(
			`Finished fetching all repositories. Successfully fetched ${chalk.greenBright(successCount)}/${repos.length} repositories${successCount === repos.length ? chalk.bold.greenBright(' (all)') : chalk.bold.yellowBright(' (' + (repos.length - successCount) + ' failed)')}.`
		);
	}
};
