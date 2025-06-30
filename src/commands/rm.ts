import chalk from 'chalk';
import envPaths from 'env-paths';
import { Argv } from 'yargs';
import { stderrWriteLn, stdoutWriteLn } from '../stdio';
import { delRepo } from '../datalib';

export const command = 'rm <nickname>';
export const desc = 'Remove a registered local Git repository by its nickname';

export const builder = (y: Argv) =>
	y.example('$0 rm <nickname>', 'Untrack a registered repository');

export const handler = async (argv: { nickname: string }) => {
	const { nickname } = argv;

	const result = await delRepo(nickname);

	if (!result)
		stderrWriteLn(`No repository found with nickname "${nickname}".`);
	else
		stdoutWriteLn(
			`Successfully unregistered "${nickname}" at path ${result.path}.`
		);

	process.exitCode = !result ? 1 : 0;
};
