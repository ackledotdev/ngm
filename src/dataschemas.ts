import { exec } from 'dugite';
import { existsSync } from 'fs';
import { JSONValueRecord } from 'jsoning';
import { join } from 'path';

export type Quantum<T> = T | undefined | null;

export interface RepoEntry extends JSONValueRecord {
	path: string;
	fetchTs: number | null;
}

export enum PhysicalRepoValidationError {
	INVALID_PATH,
	NO_GIT,
}

export function validateRepoSchema(obj: any): obj is RepoEntry {
	if (
		!(
			obj &&
			typeof obj === 'object' &&
			'path' in obj &&
			typeof obj.path === 'string' &&
			'timestamps' in obj &&
			typeof obj.timestamps === 'object' &&
			((ts) =>
				'timestamp' in ts &&
				typeof ts.registered === 'number' &&
				'lastFetched' in ts &&
				typeof ts.lastFetched === 'number')(obj.timestamps) &&
			(!('nickname' in obj) || typeof obj.nickname === 'string')
		)
	)
		return false;

	if (
		Object.keys(obj).some(
			(key) => !['path', 'nickname', 'timestamps'].includes(key)
		)
	)
		return false;

	return true;
}

export async function validatePhysicalRepoExistence(
	path: string
): Promise<true | PhysicalRepoValidationError> {
	if (path.trim() === '') return PhysicalRepoValidationError.INVALID_PATH;
	if (!existsSync(path)) return PhysicalRepoValidationError.INVALID_PATH;

	if (
		(await exec(['status'], path)).exitCode !== 0 ||
		!existsSync(join(path, '.git'))
	) {
		return PhysicalRepoValidationError.NO_GIT;
	}

	return true;
}
