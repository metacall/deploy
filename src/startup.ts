import { AxiosError } from 'axios';
import { maskedInput } from './cli/inputs';
import { warn } from './cli/messages';
import { load, save, Config } from './config';
import API from './protocol/api';
import { expiresIn } from './token';
import { forever, opt } from './utils';

export const startup = async (): Promise<Config> => {
	const config = await load();

	const askToken = (): Promise<string> =>
		maskedInput('Please enter your metacall token');

	let token: string =
		process.env['METACALL_API_KEY'] || config.token || (await askToken());

	const api = API(token, config.baseURL);

	while (forever) {
		try {
			await api.validate();
			break;
		} catch (err) {
			warn(
				'Token invalid' +
					opt(x => ': ' + x, (err as AxiosError).response?.data)
			);
			token = await askToken();
		}
	}
	if (expiresIn(token) < config.renewTime) {
		// token expires in < renewTime
		token = await api.refresh();
	}

	await save({ token });

	return Object.assign(config, { token });
};
