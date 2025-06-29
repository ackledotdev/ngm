import { Argv } from 'yargs';
import { nicknameUsed, registerRepo, RepoRegisterError } from '../datalib';
import chalk from 'chalk';
import { resolve } from 'path';

export const command = 'register [options]';
export const desc = 'Register a new local Git repository';
export const builder = (y: Argv) =>
	y
		.example(
			'$0 register -p /path/to/repodir -n reponame',
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
		console.error(
			chalk.red(
				'Could not determine a nickname for the repository. Please specify one explicitly using -n option.'
			)
		);
		process.exit(1);
	}

	if (await nicknameUsed(nick)) {
		console.error(
			chalk.red(
				`The nickname "${nick}" is already in use. Please specify a different nickname.`
			)
		);
		process.exit(1);
	}

	switch (await registerRepo(path, nick)) {
		case true:
			console.log(
				chalk.green(
					`Successfully registered repository at ${path} with nickname "${nick}".`
				)
			);
			break;

		case RepoRegisterError.INVALID_PATH:
			console.error(chalk.red(`The specified path "${path}" does not exist.`));
			process.exitCode = 1;
			break;

		case RepoRegisterError.NO_GIT:
			console.error(
				chalk.red(`The specified path "${path}" is not a Git repository.`)
			);
			process.exitCode = 1;
			break;

		case RepoRegisterError.ALREADY_REGISTERED:
			console.error(
				chalk.red(`The specified repository at ${path} is already registered.`)
			);
			process.exitCode = 1;
			break;
	}
};
