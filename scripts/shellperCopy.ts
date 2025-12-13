import { readFile, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const f = join(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'src',
	'commands',
	'shell.ts'
);
const sf = join(dirname(fileURLToPath(import.meta.url)), '..', 'shellpers.sh');

const fc = await readFile(f, 'utf-8');
const shellpers = await readFile(sf, 'utf-8');

const newf = fc.replace(
	/\/\/ SHELLPERCOPY REGION BEGIN[\s\S]*?\/\/ SHELLPERCOPY REGION END/,
	`// SHELLPERCOPY REGION BEGIN\nconst shellpers = \`${shellpers.replace(/`/g, '\\`')}\`;\n// SHELLPERCOPY REGION END`
);

await writeFile(f, newf, 'utf-8');
