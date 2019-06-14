#!/usr/bin/env node
import { input } from './cli';
import { load, save } from './config';
import { login, signup, validate, upload, deploy } from './api';
import { info, debug, fatal } from './utils';
import yargs from 'yargs';


(async () => {
	
	const config = load();

	const [ email, validToken ] = await Promise.all([
		config.email || input('Please enter your metacall email'),
		config.token && validate(config.token).catch(err =>
			err.response
				? debug('Invalid token: ' + err.response.data)
				: fatal('Could not validate token (' + err.message + ')'))
	]);

	const password = validToken ? null :
		await input('Please enter your metacall password' +
			(config.email ? ' for user ' + config.email : ''), 'password');

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

	/* Rudimentary upload code */
	const { readFileSync } = await import('fs');
	const uploadResult = await upload(token, 'GeoIP', readFileSync('GeoIP.zip'))
		.catch(err =>
			err.response
				? fatal('Could not upload package: ' + err.response.data)
				: fatal('Could not upload package (' + err.message + ')'));

	info('Upload ' + uploadResult);

	const deployResult = await deploy(token, 'GeoIP')
		.catch(err =>
			err.response
				? fatal('Could not deploy project: ' + err.response.data)
				: fatal('Could not deploy project (' + err.message + ')'));
	
	info('Deploy ' + (deployResult || 'OK'));
	/* End rudimentary code */

	save({ email, token });

})();
