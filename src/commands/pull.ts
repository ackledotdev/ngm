import { Argv } from 'yargs';
import { stdoutWarnLn, stdoutWritePlainLn } from '../stdio.ts';
import { listRepos } from '../datalib.ts';
import chalk from 'chalk';
import {
	validatePhysicalRepoExistence,
	PhysicalRepoValidationError,
} from '../dataschemas.ts';
import { exec } from 'dugite';

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

export const handler = async (args: { exclude: string[] }) => {
	stdoutWritePlainLn("Running 'git pull' on all registered repositories...");

	const repos = await listRepos();

	if (repos.length === 0) stdoutWarnLn('No repositories registered yet.');
	else {
		let successCount = 0,
			skipCount = 0;
		for (const [id, repo] of repos) {
			if (args.exclude?.includes(id)) {
				stdoutWritePlainLn(`[ ${chalk.yellow('↷')} ] Skipped pulling ${id}`);
				skipCount++;
				continue;
			}

			const physicalRepoValidationResult = await validatePhysicalRepoExistence(
				repo?.path || ''
			);

			const gitPullResult =
				physicalRepoValidationResult === true
					? (await exec(['pull', '--no-rebase'], repo!.path)).exitCode
					: null;

			const printStr = (() => {
				if (
					physicalRepoValidationResult ===
					PhysicalRepoValidationError.INVALID_PATH
				)
					return `Did not pull ${id} -> INVALID_PATH "${repo?.path ?? ''}"`;
				else if (
					physicalRepoValidationResult === PhysicalRepoValidationError.NO_GIT
				)
					return `Did not pull ${id} -> NO_GIT`;
				else if (physicalRepoValidationResult === true && gitPullResult === 0) {
					successCount++;
					return `Pulled ${id}`;
				} else if (physicalRepoValidationResult === true && gitPullResult !== 0)
					return `Failed to pull ${id} -> ${repo!.path} ('git pull' exited with code ${gitPullResult!})`;
				else return `Action failed on ${id} -> UNKNOWN_ERROR`;
			})();

			stdoutWritePlainLn(
				`[ ${
					physicalRepoValidationResult === true && gitPullResult === 0
						? chalk.green('✔')
						: chalk.red('✘')
				} ] ${printStr}`
			);
		}

		const fails = repos.length - successCount - skipCount;

		const endStr = (() => {
			if (fails > 0 && skipCount > 0)
				return chalk.bold.yellowBright(
					`(${fails} failed, ${skipCount} skipped)`
				);
			if (fails > 0) return chalk.bold.yellowBright(`(${fails} failed)`);
			if (skipCount > 0)
				return chalk.bold.yellowBright(`(${skipCount} skipped)`);
			return chalk.bold.greenBright('(all)');
		})();

		stdoutWritePlainLn(
			`Finished pulling all repositories. Successfully pulled ${chalk.greenBright(successCount)}/${repos.length} repositories ${endStr}.`
		);
	}
};
