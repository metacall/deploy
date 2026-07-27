import {
	API as APIInterface,
	isProtocolError,
	ProtocolError
} from '@metacall/protocol/protocol';
import { unlink } from 'fs/promises';
import { configFilePath, save } from '../config';
import { exists } from '../utils';
import args from './args';
import { error, info, warn } from './messages';

const handleValidateToken = async (api: APIInterface): Promise<void> => {
	const validToken = await api.validate();

	if (!validToken) {
		const token = await api.refresh();
		await save({ token });
	}
};

const invalidateConfig = async (): Promise<void> => {
	const configFile = configFilePath();
	(await exists(configFile)) && (await unlink(configFile));
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

		// Check if this is a transient network/server error (non-auth)
		if (!isProtocolError(err)) {
			// Network error, DNS failure, etc. — preserve config
			warn('Unable to reach the server. Using cached credentials.');
			return;
		}

		const protocolErr = err;
		const status = protocolErr.status;

		// Only delete config for auth-specific errors (401, 403)
		// or JWT-specific errors (invalid signature, expired)
		const isAuthError =
			status === 401 ||
			status === 403 ||
			(status === undefined && isJwtError(protocolErr));

		if (isAuthError) {
			await invalidateConfig();
			info('Try to login again!');
			return error(
				`Token validation failed, potential causes include:\n\t1) The JWT may be mistranslated (Invalid Signature).\n\t2) JWT might have expired.`
			);
		}

		// Server error (5xx) or other non-auth failure — preserve config
		warn(
			`Server error (${status ?? 'unknown'}). Using cached credentials.`
		);
	}
};

const isJwtError = (err: ProtocolError): boolean => {
	const message = (err.message ?? '').toLowerCase();
	const data = String(err.data ?? '').toLowerCase();
	return (
		message.includes('jwt') ||
		message.includes('token') ||
		data.includes('jwt') ||
		data.includes('token') ||
		data.includes('malformed') ||
		data.includes('expired')
	);
};

export default validateToken;
