/*

* About File:
	it is for dealing with the local configuration of the cli, for storing there the data

*/

import { promises as fs } from 'fs';
import { parse, stringify } from 'ini';
import { join } from 'path';
import * as z from 'zod';
import { configDir, ensureFolderExists, filter, loadFile } from './utils';

export const log = <T>(x: T): T => (console.log(x), x);

export const Config = z.object({
	baseURL: z.string(),
	apiURL: z.string(),
	devURL: z.string(),
	renewTime: z.number(),
	token: z.string().optional()
});

export const Cache = z.record(
	z.object({
		plan: z.string()
	})
);

export type Cache = z.infer<typeof Cache>;

export type Config = z.infer<typeof Config>;

const loadCache = async (path = cacheFilePath): Promise<Cache> => {
	const caches = parse(await loadFile(path));
	return Cache.parse({
		...caches
	});
};

const defaultConfig: Config = {
	baseURL: 'https://dashboard.metacall.io',
	apiURL: 'https://api.metacall.io',
	devURL: 'http://localhost:9000',
	renewTime: 1000 * 60 * 60 * 24 * 15
};

export const updateCache = async (
	key: string,
	val: string,
	path = cacheFilePath
) => {
	const cache = await loadCache(path);
	cache[key] = { plan: val };
	await fs.writeFile(cacheFilePath, stringify(cache));
};

export const cachePlan = async (key: string, path = cacheFilePath) => {
	const cache = await loadCache(path);
	return cache[key];
};

const defaultPath = configDir(join('metacall', 'deploy'));

const configFilePath = (path = defaultPath) => join(path, 'config.ini');
const cacheFilePath = join(defaultPath, 'cache.ini');

export const load = async (path = defaultPath): Promise<Config> => {
	const data = parse(
		await loadFile(configFilePath(await ensureFolderExists(path)))
	);
	return Config.nonstrict().parse({
		...defaultConfig,
		...data,
		...(data.renewTime ? { renewTime: Number(data.renewTime) } : {})
	});
};

export const save = async (
	data: Partial<Config>,
	path = defaultPath
): Promise<void> =>
	fs.writeFile(
		configFilePath(await ensureFolderExists(path)),
		stringify(
			filter(defaultConfig, {
				...(await load(path)),
				...data
			})
		)
	);
