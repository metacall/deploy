/*

* About File:
	it verifies that your token is up to date and executes any routine needed to work properly

*/

import { auth } from './auth';
import { Config, defaultPath, load } from './config';

export const startup = async (confDir: string | undefined): Promise<Config> => {
	const config = await load(confDir || defaultPath);
	const token = await auth(config);

	return Object.assign(config, { token });
};
