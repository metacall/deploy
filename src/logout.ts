import { unlink } from 'fs/promises';
import { error, success } from './cli/messages';
import { configFilePath } from './config';
import { exists } from './utils';

export const logout = async (): Promise<void> => {
	const configFile = configFilePath();

	!(await exists(configFile)) &&
		error('You are not logged in. Please log in first.');

	await unlink(configFile);

	success('Logged out successfully.');
};
