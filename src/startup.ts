import { AxiosError } from 'axios';
import { maskedInput } from './cli';
import { load, save } from './config';
import { refresh, validate } from './protocol/api';
import { expiresIn } from './token';
import { forever, opt, warn } from './utils';

export const startup = async (): Promise<string> => {
	const config = await load();
	const askToken = async () =>
		maskedInput('Please enter your metacall token');

	let token = config.token || (await askToken());

	while (forever) {
		try {
			await validate(token);
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
		token = await refresh(token, config.baseURL);
	}

	await save({ token });

	return token;
};
