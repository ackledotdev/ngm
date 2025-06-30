import { Argv } from 'yargs';
import { stdoutWarnLn, stdoutWritePlainLn } from '../stdio';
import { listRepos } from '../datalib';
import chalk from 'chalk';
import {
	validatePhysicalRepoExistence,
	PhysicalRepoValidationError,
} from '../dataschemas';
import { GitProcess } from 'dugite';

export const command = 'fetch';
export const desc = 'Fetch updates for all registered local Git repositories';

export const builder = (y: Argv) =>
	y.example('$0 fetch', 'Fetch updates for all registered repositories');

export const handler = async () => {
	stdoutWritePlainLn("Running 'git fetch' on all registered repositories...");

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
