/**
 * NGM: Node Git Manager
 * Manage your local Git repositories with ease
 * Akhil Pillai <ackledotdev@gmail.com> https://ackle.vercel.app
 * MIT License
 */

import { stdout } from 'process';
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
	.alias('h', 'help');

await cmd.parse();
if (args.length === 0) stdout.write((await cmd.getHelp()) + '\n');
