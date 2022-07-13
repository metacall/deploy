import { unlink } from 'fs/promises';
import { error, info } from './cli/messages';
import { configFilePath } from './config';
import { exists } from './utils';

export const logout = async (): Promise<void> => {
	const configFile = configFilePath();

	!(await exists(configFile)) &&
		error("You haven't logged in yet! , kindly log in.");

	await unlink(configFile);

	info('Your session has expired! , See you later.');
};
