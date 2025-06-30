import { defineConfig } from 'bumpp';

export default defineConfig({
	all: true,
	commit: true,
	confirm: true,
	files: ['package.json', 'package-lock.json'],
	install: true,
	noGitCheck: true,
	printCommits: true,
	push: true,
	release: 'prompt',
	sign: true,
	tag: true,
});
