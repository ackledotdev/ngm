import chalk from 'chalk';

export function stderrWriteLn(message: string) {
	process.stderr.write(chalk.red(message) + '\n');
}

export function stdoutWriteLn(message: string) {
	process.stdout.write(chalk.green(message) + '\n');
}

export function stdoutWarnLn(message: string) {
	process.stdout.write(chalk.yellow(message) + '\n');
}
