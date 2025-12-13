import { Argv } from 'yargs';
import { stderrWarnLn, stdoutWritePlainLn } from '../stdio.ts';
import { getRepo } from '../datalib.ts';
import {
	validatePhysicalRepoExistence,
	PhysicalRepoValidationError,
} from '../dataschemas.ts';

/**
 * Disregard any descriptions below. This command locates the repository on the filesystem and returns the absolute path.
 */

export const command = 'dir <nickname> [options]';
export const desc = 'Locate a repository on the filesystem.';

export const builder = (y: Argv) =>
	y
		.example('$0 dir <nickname>', 'Locate a repository on the filesystem.')
		.option('quiet', {
			alias: 'q',
			type: 'boolean',
			description:
				'Suppress warning messages; only output the repository path if found.',
			demandOption: false,
			default: false,
		});

export const handler = async (argv: { nickname: string; quiet?: boolean }) => {
	const { nickname, quiet = false } = argv;

	const repo = await getRepo(nickname);

	if (repo === 0 && !quiet) {
		quiet || stderrWarnLn(`No repositories have been added yet.`);
		process.exitCode = 1;
	} else if (typeof repo === 'number') {
		quiet || stderrWarnLn(`No repository found with nickname '${nickname}'.`);
		process.exitCode = 2;
	}
	if (!repo || typeof repo === 'number') return;

	const repoExists = await validatePhysicalRepoExistence(repo.path);

	if (!repoExists && repoExists === PhysicalRepoValidationError.INVALID_PATH) {
		quiet ||
			stderrWarnLn(
				`The repository path for nickname '${nickname}' is invalid or inaccessible: ${repo.path}`
			);
		process.exitCode = 3;
	} else if (repoExists === PhysicalRepoValidationError.NO_GIT && !quiet) {
		quiet ||
			stderrWarnLn(
				`Warning: The repository at '${repo.path}' does not contain a valid Git repository.`
			);
		process.exitCode = 5;
	}

	stdoutWritePlainLn(repo.path);
};
