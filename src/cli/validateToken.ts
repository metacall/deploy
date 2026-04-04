import { API as APIInterface } from '@metacall/protocol/protocol';
import { unlink } from 'fs/promises';
import { configFilePath, save } from '../config';
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

const isAuthFailure = (err: unknown): boolean => {
	const response = (err as { response?: { status?: number; data?: unknown } })
		?.response;
	const status = response?.status;
	const message = String(response?.data || (err as Error)?.message || '')
		.toLowerCase()
		.trim();

	if (status === 401 || status === 403) {
		return true;
	}

	return [
		'jwt',
		'token',
		'unauthorized',
		'forbidden',
		'authorization',
		'credentials',
		'invalid signature',
		'expired'
	].some(pattern => message.includes(pattern));
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

		if (!isAuthFailure(err)) {
			return error(
				'Token validation could not be completed because the server is unavailable or returned an unexpected error. Cached credentials were preserved, please try again.'
			);
		}

		// Removing cache such that user will have to login again.

		const configFile = configFilePath();

		(await exists(configFile)) && (await unlink(configFile));

		info('Try to login again!');

		return error(
			`Token validation failed, potential causes include:\n\t1) The JWT may be mistranslated (Invalid Signature).\n\t2) JWT might have expired.`
		);
	}
};

export default validateToken;
