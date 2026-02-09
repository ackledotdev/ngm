#!/usr/bin/env node

if (process.argv.length > 2 && process.argv[2] === 'shell') {
	process.stdout.write(
		await import('./commands/shell.ts').then((mod) => mod.shellpers)
	);
	process.exit(0);
}

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const args = hideBin(process.argv);

const cmd = yargs(args)
	.scriptName('ngm')
	.usage('$0 <command> [options]')
	.commandDir('commands', { extensions: ['ts', 'js'] })
	.help()
	.strict()
	// .recommendCommands()
	.alias('h', 'help')
	.alias('v', 'version');

await cmd.parse();
if (args.length === 0) process.stdout.write((await cmd.getHelp()) + '\n');
