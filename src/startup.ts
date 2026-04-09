/*

* About File:
	
	It loads the config and assigns the jwt to the config Object
	JWT = "", empty string if the dev mode is on

*/

import { auth } from './auth';
import args from './cli/args';
import { Config, load } from './config';

const devToken = 'local'; // Use some random token in order to proceed

export const startup = async (): Promise<Config> => {
	const config = await load();
	const token = args['dev'] ? devToken : await auth(config);

	return Object.assign(config, { token });
};
