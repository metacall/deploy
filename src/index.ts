#!/usr/bin/env node
import { input } from './cli';
import { load, save } from './config';
import { login, signup, validate, upload } from './api';
import { info, debug, fatal } from './utils';

const config = load();

(async () => {

	const [ email, validToken ] = await Promise.all([
		config.email || input('Please enter your metacall email'),
		config.token && validate(config.token).catch(err =>
			err.response
				? debug('Invalid token: ' + err.response.data)
				: fatal('Could not validate token (' + err.message + ')'))
	]);

	const password = validToken ? null :
		await input('Please enter your metacall password', 'password');

	const token = validToken ? config.token :
		await login(email, password, config.baseURL).catch(err =>
			err.response
				? err.response.data === 'account does not exist'
					? (
						info(err.response.data + ', attempting to sign up'),
						signup(email, password, config.baseURL).catch(err =>
							err.response
								? fatal('Could not sign up: ' + err.response.data)
								: fatal('Could not sign up (' + err.message + ')')))
					: fatal('Could not sign in: ' + err.response.data)
				: fatal('Could not sign in (' + err.message + ')'));

	if (!token) {
		fatal('Wrong username or password!');
	}

	/* Rudimentary upload code
	const { readFileSync } = await import('fs');
	const uploadResult = await upload(token, readFileSync('GeoIP.zip'))
		.catch(err =>
			err.response
				? fatal('Could not upload project: ' + err.response.data)
				: fatal('Could not upload package (' + err.response.data + ')'));

	info('Upload ' + uploadResult);
	*/

	save({ email, token });

})();
