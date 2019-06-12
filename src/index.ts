import { input } from './cli';
import { load, save } from './config';
import { login, validate } from './api';
import { fatal } from './utils';

const config = load();

(async () => {

	const [ email, validToken ] = await Promise.all([
		config.email || input('Please enter your metacall email'),
		config.token && validate(config.token)
	]);

	const password = validToken ? null :
		await input('Please enter your metacall password', 'password');

	const token = validToken ? config.token :
		await login(email, password, config.baseURL);

	if (!token) {
		fatal('Wrong username or password!');
	}

	save({ email, token });

})();
