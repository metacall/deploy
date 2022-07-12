import { unlink } from 'fs/promises';
import { join } from 'path';
import { error, info } from './cli/messages';
import { configDir, exists } from './utils';

export const logout = async (): Promise<void> => {
	const path = configDir(join('metacall', 'deploy', 'config.ini'));

	!(await exists(path)) &&
		error("You haven't logged in yet! , kindly log in.");

	await unlink(path);

	info('Your session has expired! , See you later.');
};
