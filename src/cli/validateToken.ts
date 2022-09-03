import API from '@metacall/protocol/protocol';
import { Config, save } from '../config';

export const validateToken = async (config: Config): Promise<void> => {
	const api = API(config.token as string, config.baseURL);

	const validToken = await api.validate();
	if (!validToken) {
		const token = await api.refresh();

		await save({ token });
	}
};
