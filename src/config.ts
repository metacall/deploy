/*

* About File:
	it is for dealing with the local configuration of the cli, for storing there the data

*/

import { promises as fs } from 'fs';
import { parse, stringify } from 'ini';
import { join } from 'path';
import * as z from 'zod';
import args from './cli/args';
import { configDir, ensureFolderExists, filter, loadFile } from './utils';

export const Config = z.object({
	baseURL: z.string(),
	apiURL: z.string(),
	devURL: z.string(),
	renewTime: z.number(),
	token: z.string().optional()
});

export type Config = z.infer<typeof Config>;

const defaultConfig: Config = {
	baseURL: 'https://dashboard.metacall.io',
	apiURL: 'https://api.metacall.io',
	devURL: 'http://localhost:9000',
	renewTime: 1000 * 60 * 60 * 24 * 15
};

export const defaultPath = configDir(join('metacall', 'deploy'));

export const configFilePath = (path = args['confDir'] || defaultPath) =>
	join(path, 'config.ini');

export const load = async (
	path = args['confDir'] || defaultPath
): Promise<Config> => {
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
	path = args['confDir'] || defaultPath
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
