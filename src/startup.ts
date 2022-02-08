/*

* About File:
	it verifies that your token is up to date and executes any routine needed to work properly

*/

import { auth } from './auth';
import { info } from './cli/messages';
import { Config, load, save } from './config';

export const startup = async (): Promise<Config> => {
	const config = await load();
	const token = await auth(config);

	await save({ token });

	info('Login Successfull!');

	return Object.assign(config, { token });
};
