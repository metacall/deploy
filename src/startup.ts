/*

* About File:
	it verifies that your token is up to date and executes any routine needed to work properly

*/

import { auth } from './auth';
import { Config, load } from './config';

export const startup = async (): Promise<Config> => {
	const config = await load();
	const token = await auth(config);

	return Object.assign(config, { token });
};
