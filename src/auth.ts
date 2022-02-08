/*
 About File:
  1) CLI login
	2) If there is no token present, then it asks for your loging credentials and saves the token into config.

*/
import { AxiosError } from 'axios';
import login from 'metacall-protocol/login';
import { input, maskedInput } from './cli/inputs';
import { info, warn } from './cli/messages';
import { load, save } from './config';
import { args } from './index';
import { forever, opt } from './utils';

export const auth = async (): Promise<void> => {
	const config = await load();

	let token: string = process.env['METACALL_API_KEY'] || config.token || '';

	// If there is token simply return.
	if (token) return;

	// If no token then must evaluate it using login.
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
	// Now we got email and password let's call login api endpoint and get the token and store it int somewhere else.

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

	await save({ token });

	info('Login Successfull!');
};
