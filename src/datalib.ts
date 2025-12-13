import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import envPaths from 'env-paths';
import Jsoning from 'jsoning';
import { join } from 'path';
import { Quantum, RepoEntry, validateRepoSchema } from './dataschemas.ts';
import { stdoutWarnLn } from './stdio.ts';

export async function createDataDirsIfNot() {
	const { config: configDir, data: dataDir } = envPaths('ngm');

	let created = false;

	if (!existsSync(configDir)) {
		stdoutWarnLn(`Config directory does not exist. Creating at ${configDir}`);
		await mkdir(configDir, { recursive: true }).catch((err) =>
			console.error('Error creating config directory', err)
		);
		created = true;
	}

	if (!existsSync(dataDir)) {
		stdoutWarnLn(`Data directory does not exist. Creating at ${dataDir}`);
		await mkdir(dataDir, { recursive: true }).catch((err) =>
			stdoutWarnLn(`Error creating data directory: ${err}`)
		);
		created = true;
	}

	return created;
}

export async function listRepos(): Promise<[string, Quantum<RepoEntry>][]> {
	if (await createDataDirsIfNot()) return [];
	const { data: dataDir } = envPaths('ngm');
	return Object.entries(
		((await new Jsoning(join(dataDir, 'repos.json')).all()) as Record<
			string,
			Quantum<RepoEntry>
		>) || {}
	);
}

export async function sanityCheck() {
	await createDataDirsIfNot();

	const { data: dataDir } = envPaths('ngm');

	const invalidEntries = Object.entries(
		((await new Jsoning(join(dataDir, 'repos.json')).all()) as Record<
			string,
			Quantum<RepoEntry>
		>) || {}
	).filter(([_, repo]) => !validateRepoSchema(repo));

	return invalidEntries.length === 0 ? true : invalidEntries;
}

export enum RepoRegisterError {
	INVALID_PATH,
	NO_GIT,
	ALREADY_REGISTERED,
}

export async function registerRepo(
	path: string,
	nickname: string
): Promise<true | RepoRegisterError> {
	await createDataDirsIfNot();

	const { data: dataDir } = envPaths('ngm');
	const db = new Jsoning(join(dataDir, 'repos.json'));
	const repos = ((await db.all()) as Record<string, Quantum<RepoEntry>>) || {};

	if (!existsSync(path)) return RepoRegisterError.INVALID_PATH;

	const gitDir = join(path, '.git');
	if (!existsSync(gitDir)) return RepoRegisterError.NO_GIT;

	if (Object.values(repos).some((repo) => repo?.path === path))
		return RepoRegisterError.ALREADY_REGISTERED;

	if (Object.keys(repos).includes(nickname))
		return RepoRegisterError.ALREADY_REGISTERED;

	await db.set(nickname, { path, nickname, fetchTs: null } satisfies RepoEntry);

	return true;
}

export async function delRepo(nickname: string) {
	if (await createDataDirsIfNot()) return false;
	const { data: dataDir } = envPaths('ngm');
	const db = new Jsoning(join(dataDir, 'repos.json'));
	const data = (await db.get(nickname)) as Quantum<RepoEntry>;

	if (!data) return false;
	await db.delete(nickname);
	return data;
}

/**
 * @returns {false | Quantum<RepoEntry> | number} The repository entry if found, otherwise the number of registered repositories, or false if data dirs were just created.
 */
export async function getRepo(nickname: string) {
	if (await createDataDirsIfNot()) return false;
	const { data: dataDir } = envPaths('ngm');
	const db = new Jsoning(join(dataDir, 'repos.json'));
	const data = (await db.get(nickname)) as Quantum<RepoEntry>;
	return data ?? Object.keys(await db.all()).length;
}

export async function nicknameUsed(nickname: string) {
	if (await createDataDirsIfNot()) return false;

	const { data: dataDir } = envPaths('ngm');
	return new Jsoning(join(dataDir, 'repos.json')).has(nickname);
}
