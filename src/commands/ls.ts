import chalk from 'chalk';
import { Argv } from 'yargs';
import { stdoutWarnLn, stdoutWritePlainLn } from '../stdio.ts';
import { listRepos } from '../datalib.ts';
import {
	PhysicalRepoValidationError,
	validatePhysicalRepoExistence,
} from '../dataschemas.ts';

export const command = 'ls';
export const desc = 'List all registered local Git repositories';

export const builder = (y: Argv) =>
	y.example('$0 ls', 'Show all tracked repositories');

export const handler = async () => {
	const repos = await listRepos();

	if (repos.length === 0) stdoutWarnLn('No repositories registered yet.');
	else {
		stdoutWritePlainLn('Registered repositories:');
		for (const [id, repo] of repos) {
			const physicalRepoValidationResult = await validatePhysicalRepoExistence(
				repo?.path || ''
			);

			const pathStr = (() => {
				if (physicalRepoValidationResult === true) return repo!.path;
				else if (
					physicalRepoValidationResult ===
					PhysicalRepoValidationError.INVALID_PATH
				)
					return '"' + (repo?.path ?? '') + '" INVALID_PATH';
				else if (
					physicalRepoValidationResult === PhysicalRepoValidationError.NO_GIT
				)
					return `${repo!.path} NO_GIT`;
				else return `${repo?.path ?? ''} UNKNOWN_ERROR`;
			})();

			stdoutWritePlainLn(
				`[ ${
					physicalRepoValidationResult === true
						? chalk.green('█')
						: chalk.red('█')
				} ] ${id} -> ${pathStr}`
			);
		}
	}
};
