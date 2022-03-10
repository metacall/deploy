import AxiosError from 'axios-error';
import API from 'metacall-protocol/protocol';
import { apiError, info } from './cli/messages';
import { startup } from './startup';

export const del = async (
	prefix: string,
	suffix: string,
	version: string
): Promise<void> => {
	const config = await startup();
	const api = API(config.token as string, config.baseURL);

	try {
		info(await api.deployDelete(prefix, suffix, version));
	} catch (err) {
		apiError(err as AxiosError);
	}
};
