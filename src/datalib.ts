import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import envPaths from 'env-paths';
import Jsoning from 'jsoning';
import { join } from 'path';
import { Quantum, RepoEntry, validateRepoSchema } from './dataschemas.ts';
import { stdoutWarnLn } from './stdio.ts';

/**
 * Create data directories if they do not exist
 * @returns {Promise<boolean>} True if any directories were created, otherwise false
 */
export async function createDataDirsIfNot(): Promise<boolean> {
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

/**
 * List all registered repositories
 * @returns {Promise<[string, Quantum<RepoEntry>][]>} A list of registered repositories
 */
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

/**
 * Validate entries in the repos database
 * @returns {Promise<true | [string, Quantum<RepoEntry>][]>} True if all entries are valid, otherwise an array of invalid entries with their keys
 */
export async function sanityCheck(): Promise<true | [string, Quantum<RepoEntry>][]> {
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

/**
 * @enum RepoRegisterError
 * @description Errors that can occur when registering a repository
 * @member INVALID_PATH The provided path does not exist
 * @member NO_GIT The provided path is not a Git repository
 * @member ALREADY_REGISTERED The provided path or nickname is already registered
 */
export enum RepoRegisterError {
	INVALID_PATH,
	NO_GIT,
	ALREADY_REGISTERED,
}

/**
 * Register a new repository
 * @param path {string} The file system path to the repository
 * @param nickname {string} The nickname to register the repository under
 * @returns {Promise<true | RepoRegisterError>} True on success or an error on failure
 */
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

/**
 * Attempt to delete a repository entry
 * @param nickname {string} The nickname of the repository to delete
 * @returns {Promise<false | RepoEntry>} The deleted repository entry if it existed and was deleted, or false if it did not exist or data dirs were just created.
 */
export async function delRepo(nickname: string): Promise<false | RepoEntry> {
	if (await createDataDirsIfNot()) return false;
	const { data: dataDir } = envPaths('ngm');
	const db = new Jsoning(join(dataDir, 'repos.json'));
	const data = (await db.get(nickname)) as Quantum<RepoEntry>;

	if (!data) return false;
	await db.delete(nickname);
	return data;
}

/**
 * @returns {Promise<false | Quantum<RepoEntry> | number>} The repository entry if found, otherwise the number of registered repositories, or false if data dirs were just created.
 */
export async function getRepo(
	nickname: string
): Promise<false | Quantum<RepoEntry> | number> {
	if (await createDataDirsIfNot()) return false;
	const { data: dataDir } = envPaths('ngm');
	const db = new Jsoning(join(dataDir, 'repos.json'));
	const data = (await db.get(nickname)) as Quantum<RepoEntry>;
	return data ?? Object.keys(await db.all()).length;
}

/**
 * Check if a nickname is already in use
 * @param nickname {string} The nickname to check
 * @returns {Promise<boolean>}
 */
export async function nicknameUsed(nickname: string): Promise<boolean> {
	if (await createDataDirsIfNot()) return false;

	const { data: dataDir } = envPaths('ngm');
	return new Jsoning(join(dataDir, 'repos.json')).has(nickname);
}
