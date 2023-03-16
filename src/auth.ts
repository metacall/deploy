/*
 About File:
  1) CLI login
	2) If there is no token present, then it asks for your loging credentials and saves the token into config.

*/

// remember to uninstall it
import login from '@metacall/protocol/login';
import API, { ProtocolError } from '@metacall/protocol/protocol';
import signup from '@metacall/protocol/signup';
import { expiresIn } from '@metacall/protocol/token';
import args from './cli/args';
import { input, maskedInput } from './cli/inputs';
import { error, info, warn } from './cli/messages';
import { loginSelection } from './cli/selection';
import { Config, save } from './config';
import { ErrorCode } from './deploy';
import { forever } from './utils';

const authToken = async (config: Config): Promise<string> => {
	const askToken = (): Promise<string> =>
		maskedInput('Please enter your metacall token');

	const shouldKeepAsking = args['token'] === undefined;
	let token: string = args['token'] || (await askToken());

	const api = API(token, config.baseURL);

	if (process.stdout.isTTY && shouldKeepAsking) {
		while (forever) {
			try {
				await api.validate();
				break;
			} catch (err) {
				warn(
					`Token invalid: ${String(
						(err as ProtocolError).response?.data
					)}`
				);
				token = await askToken();
			}
		}
	} else {
		try {
			await api.validate();
		} catch (err) {
			error(
				`Token invalid: ${String(
					(err as ProtocolError).response?.data
				)}`
			);
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
		input('Please enter your email id:');

	const askPassword = (): Promise<string> =>
		maskedInput('Please enter your password:');

	let email = '';
	let password = '';

	const shouldKeepAsking =
		args['email'] === undefined || args['password'] === undefined;

	const askCredentials = async (): Promise<void> => {
		email = args['email'] || (await askEmail());
		password = args['password'] || (await askPassword());
	};

	await askCredentials();

	// Now we got email and password let's call login api endpoint and get the token and store it int somewhere else
	let token = '';

	if (process.stdout.isTTY && shouldKeepAsking) {
		while (forever) {
			try {
				token = await login(email, password, config.baseURL);
				break;
			} catch (err) {
				warn(String((err as ProtocolError).response?.data));
				args['email'] = args['password'] = undefined;
				await askCredentials();
			}
		}
	} else {
		try {
			token = await login(email, password, config.baseURL);
		} catch (err) {
			error(String((err as ProtocolError).response?.data));
		}
	}

	return token;
};

const authSignup = async (config: Config): Promise<string> => {
	const askEmail = (): Promise<string> =>
		input('Please enter your email id:');

	const askAlias = (): Promise<string> => input('Please enter your Alias:');

	const askPassword = (): Promise<string> =>
		maskedInput('Please enter your password:');

	const askPasswordConfirmation = (): Promise<string> =>
		maskedInput('Confirm password');

	let email = '';
	let password = '';
	let passwordConfirmation = '';
	let userAlias = '';

	const askData = async (): Promise<void> => {
		email = await askEmail();
		userAlias = await askAlias();

		while (forever) {
			password = await askPassword();
			passwordConfirmation = await askPasswordConfirmation();

			if (password !== passwordConfirmation)
				warn('Passwords did not match.');
			else break;
		}
	};

	await askData();

	let res: string;

	while (forever) {
		try {
			res = await signup(email, password, userAlias, config.baseURL);
			info(res);
			break;
		} catch (err) {
			const errorMessage = String((err as ProtocolError).response?.data);

			warn(errorMessage);

			if (errorMessage.includes('exists')) {
				email = await askEmail();
			} else if (errorMessage.includes('alias')) {
				userAlias = await askAlias();
			}
		}
	}
	return process.exit(ErrorCode.Ok);
};

const authSelection = async (config: Config): Promise<string> => {
	const token = await (async () => {
		if (args['email'] || args['password']) {
			return await authLogin(config);
		} else if (args['token']) {
			return await authToken(config);
		} else {
			const methods: Record<string, (config: Config) => Promise<string>> =
				{
					'Login by token': authToken,
					'Login by email and password': authLogin,
					'Signup ': authSignup
				};

			return await methods[await loginSelection(Object.keys(methods))](
				config
			);
		}
	})();

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
