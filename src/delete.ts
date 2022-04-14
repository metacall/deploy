import API, { ProtocolError } from 'metacall-protocol/protocol';
import { apiError, info } from './cli/messages';
import { startup } from './startup';

export const del = async (
	prefix: string,
	suffix: string,
	version: string
): Promise<string> => {
	const config = await startup();
	const api = API(config.token as string, config.baseURL);

	let res = '';

	try {
		res = await api.deployDelete(prefix, suffix, version);

		info(res);
	} catch (err) {
		apiError(err as ProtocolError);
	}

	return res;
};
