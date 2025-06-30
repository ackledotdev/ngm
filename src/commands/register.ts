import { Argv } from 'yargs';
import { nicknameUsed, registerRepo, RepoRegisterError } from '../datalib';
import chalk from 'chalk';
import { resolve } from 'path';
import { stderrWriteLn, stdoutWriteLn } from '../stdio';

export const command = 'register [options]';
export const desc = 'Register a new local Git repository';
export const builder = (y: Argv) =>
	y
		.example(
			'$0 register --path /path/to/repodir --nickname reponame',
			'Register a repository with a nickname'
		)
		.option('path', {
			alias: 'p',
			type: 'string',
			description: 'Path to the local Git repository',
			demandOption: false,
			default: '.',
		})
		.option('nickname', {
			alias: 'n',
			type: 'string',
			description: 'Nickname for the repository',
			demandOption: false,
		});

export const handler = async (argv: { path: string; nickname?: string }) => {
	const path = resolve(argv.path);
	const nick = argv.nickname || path.split('/').pop();

	if (!nick) {
		stderrWriteLn(
			'Could not determine a nickname for the repository. Please specify one explicitly using -n option.'
		);
		process.exit(1);
	}

	if (nick.length > 24) {
		stderrWriteLn(
			`The nickname "${nick}" is too long (${nick.length}/32 characters). Please choose a shorter nickname.`
		);
		process.exit(1);
	}

	if (!/^[a-zA-Z0-9-_\.\/]+$/.test(nick)) {
		stderrWriteLn(
			`The nickname "${nick}" contains invalid characters. Only alphanumeric characters, hyphens (-), underscores (_), periods (.), and slashes (/) are allowed.`
		);
		process.exit(1);
	}

	if (await nicknameUsed(nick)) {
		stderrWriteLn(
			`The nickname "${nick}" is already in use. Please specify a different nickname.`
		);
		process.exit(1);
	}

	switch (await registerRepo(path, nick)) {
		case true:
			stdoutWriteLn(
				`Successfully registered repository at ${path} with nickname "${nick}".`
			);
			break;

		case RepoRegisterError.INVALID_PATH:
			stderrWriteLn(`The specified path "${path}" does not exist.`);
			process.exitCode = 1;
			break;

		case RepoRegisterError.NO_GIT:
			stderrWriteLn(`The specified path "${path}" is not a Git repository.`);
			process.exitCode = 1;
			break;

		case RepoRegisterError.ALREADY_REGISTERED:
			stderrWriteLn(
				`The specified repository at ${path} is already registered.`
			);
			process.exitCode = 1;
			break;
	}
};
