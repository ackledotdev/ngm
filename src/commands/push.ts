import { GitProcess } from 'dugite';
import { listRepos } from '../datalib.ts';
import {
	PhysicalRepoValidationError,
	validatePhysicalRepoExistence,
} from '../dataschemas.ts';
import { stdoutWarnLn, stdoutWritePlainLn } from '../stdio.ts';
import chalk from 'chalk';
import { Argv } from 'yargs';

export const command = 'push';
export const desc = 'Push all registered local Git repositories';

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
			'$0 push --exclude repo1 --exclude repo2',
			'Push changes for all registered repositories except repo1 and repo2'
		);

export const handler = async (args: { exclude: string[] }) => {
	stdoutWritePlainLn("Running 'git push' on all registered repositories...");

	const repos = await listRepos();

	if (repos.length === 0) stdoutWarnLn('No repositories registered yet.');
	else {
		let successCount = 0,
			skipCount = 0;
		for (const [id, repo] of repos) {
			if (args.exclude?.includes(id)) {
				stdoutWritePlainLn(`[ ${chalk.yellow('↷')} ] Skipped pushing ${id}`);
				skipCount++;
				continue;
			}

			const physicalRepoValidationResult = await validatePhysicalRepoExistence(
				repo?.path || ''
			);

			const gitPushResult =
				physicalRepoValidationResult === true
					? (await GitProcess.exec(['push'], repo!.path)).exitCode
					: null;

			const printStr = (() => {
				if (
					physicalRepoValidationResult ===
					PhysicalRepoValidationError.INVALID_PATH
				)
					return `Did not push ${id} -> INVALID_PATH "${repo?.path ?? ''}"`;
				else if (
					physicalRepoValidationResult === PhysicalRepoValidationError.NO_GIT
				)
					return `Did not push ${id} -> NO_GIT`;
				else if (physicalRepoValidationResult === true && gitPushResult === 0) {
					successCount++;
					return `Pushed ${id}`;
				} else if (physicalRepoValidationResult === true && gitPushResult !== 0)
					return `Failed to push ${id} -> ${repo!.path} ('git push' exited with code ${gitPushResult!})`;
				else return `Action failed on ${id} -> UNKNOWN_ERROR`;
			})();

			stdoutWritePlainLn(
				`[ ${
					physicalRepoValidationResult === true && gitPushResult === 0
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
			`Finished pushing all repositories. Successfully pushed ${chalk.greenBright(successCount)}/${repos.length} repositories ${endStr}.`
		);
	}
};
