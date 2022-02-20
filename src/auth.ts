/*
 About File:
  1) CLI login
	2) If there is no token present, then it asks for your loging credentials and saves the token into config.

*/
import { AxiosError } from 'axios';
import login from 'metacall-protocol/login';
import API from 'metacall-protocol/protocol';
import { expiresIn } from 'metacall-protocol/token';
import args from './cli/cliargs';
import { input, maskedInput } from './cli/inputs';
import { info, warn } from './cli/messages';
import { loginSelection } from './cli/selection';
import { Config, save } from './config';
import { forever, opt } from './utils';

const authToken = async (config: Config): Promise<string> => {
	const askToken = (): Promise<string> =>
		maskedInput('Please enter your metacall token');

	let token: string = await askToken();

	const api = API(token, config.baseURL);

	while (forever) {
		try {
			await api.validate();
			break;
		} catch (err) {
			warn(
				'Token invalid' +
					opt(
						x => ': ' + x,
						String((err as AxiosError).response?.data)
					)
			);
			token = await askToken();
		}
	}

	if (expiresIn(token) < config.renewTime) {
		// Token expires in < renewTime
		token = await api.refresh();
	}

	return token;
};

const authLogin = async (config: Config): Promise<string> => {
	const askEmail = (): Promise<string> =>
		input('Please enter your email id: ');

	const askPassword = (): Promise<string> =>
		maskedInput('Please enter your password: ');

	let email = '';
	let password = '';

	const askCredentials = async (): Promise<void> => {
		email = args['email'] || (await askEmail());
		password = args['password'] || (await askPassword());
	};

	await askCredentials();

	// Now we got email and password let's call login api endpoint and get the token and store it int somewhere else
	let token = '';

	while (forever) {
		try {
			token = await login(email, password, config.baseURL);
			break;
		} catch (err) {
			warn(
				opt(x => ': ' + x, String((err as AxiosError).response?.data))
			);
			await askCredentials();
		}
	}

	return token;
};

const authSelection = async (config: Config): Promise<string> => {
	const methods: Record<string, (config: Config) => Promise<string>> = {
		'Login by token': authToken,
		'Login by email and password': authLogin
	};

	const token = await methods[await loginSelection(Object.keys(methods))](
		config
	);

	await save({ token });

	info('Login Successfull!');

	return token;
};

export const auth = async (config: Config): Promise<string> => {
	const token =
		process.env['METACALL_API_KEY'] ||
		config.token ||
		(await authSelection(config));

	return token;
};
