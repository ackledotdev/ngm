import { Argv } from 'yargs';
import { stdoutWarnLn, stdoutWritePlainLn } from '../stdio.ts';
import { listRepos } from '../datalib.ts';
import chalk from 'chalk';
import {
	validatePhysicalRepoExistence,
	PhysicalRepoValidationError,
} from '../dataschemas.ts';
import { GitProcess } from 'dugite';

export const command = 'stat';
export const desc = 'Show the status of all registered local Git repositories';

export const builder = (y: Argv) =>
	y.example('$0 stat', 'Show the status of all registered repositories');

export const handler = async () => {
	stdoutWritePlainLn("Running 'git status' on all registered repositories...");

	const repos = await listRepos();

	if (repos.length === 0) stdoutWarnLn('No repositories registered yet.');
	else {
		for (const [id, repo] of repos) {
			const physicalRepoValidationResult = await validatePhysicalRepoExistence(
				repo?.path || ''
			);

			const gitStatResult =
				physicalRepoValidationResult === true
					? await GitProcess.exec(['status', '-s'], repo!.path)
					: null;

			const printStr = (() => {
				if (
					physicalRepoValidationResult ===
					PhysicalRepoValidationError.INVALID_PATH
				)
					return `No status on ${id} -> INVALID_PATH "${repo?.path ?? ''}"`;
				else if (
					physicalRepoValidationResult === PhysicalRepoValidationError.NO_GIT
				)
					return `No status on ${id} -> NO_GIT`;
				else if (
					physicalRepoValidationResult === true &&
					gitStatResult!.exitCode === 0
				)
					return `Status of ${id}:\n${
						gitStatResult!.stdout
							.trimEnd()
							.split('\n')
							.map((line) =>
								line
									.split('')
									.map((s, i) =>
										i === 0
											? chalk.bold.green(s)
											: i === 1
												? chalk.bold.red(s)
												: s
									)
									.join('')
							)
							.join('\n') || '   Working tree clean'
					}`;
				else return `Action failed on ${id} -> UNKNOWN_ERROR`;
			})();

			const repoResultChar = (() => {
				if (
					physicalRepoValidationResult === true &&
					gitStatResult!.exitCode === 0
				)
					return chalk.green('✓');
				else return chalk.red('✗');
			})();

			stdoutWritePlainLn(`[ ${repoResultChar} ] ${printStr}`);
		}
	}
};
