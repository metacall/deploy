import { API as APIInterface } from '@metacall/protocol/protocol';
import { unlink } from 'fs/promises';
import { auth } from '../auth';
import { configFilePath, defaultPath, load, save } from '../config';
import { exists } from '../utils';
import args from './args';
import { error, info } from './messages';

const handleValidateToken = async (api: APIInterface): Promise<void> => {
	const validToken = await api.validate();

	if (!validToken) {
		const token = await api.refresh();
		await save({ token });
	}
};

const validateToken = async (api: APIInterface): Promise<void> => {
	try {
		await handleValidateToken(api);
	} catch (err) {
		if (args['dev']) {
			info(
				'Please visit https://github.com/metacall/faas to learn how to set up FaaS locally.'
			);

			return error('FaaS is not serving locally.');
		}

		// Removing cache such that user will have to login again.

		const configFile = configFilePath();

		(await exists(configFile)) && (await unlink(configFile));

		info('Token expired, initiating token-based login...');

		try {
			const config = await load(defaultPath);

			const newToken = await auth(config);
			// Save the new token
			await save({ token: newToken });
			return;
		} catch (loginErr) {
			return error('Token validation failed. Please try again.');
		}
	}
};

export default validateToken;
