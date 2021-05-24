#!/usr/bin/env node
import { AxiosError } from 'axios';
import { refresh, validate, listSubscriptions } from './api';
import { input } from './cli';
import { load, save } from './config';
import { expiresIn } from './token';
import { forever, opt, warn } from './utils';

void (async () => {
	const config = await load();

	let token =
		config.token || (await input('Please enter your metacall token'));

	while (forever) {
		try {
			await validate(token);
			break;
		} catch (err) {
			warn(
				'Token invalid' +
					opt(x => ': ' + x, (err as AxiosError).response?.data)
			);
			token = await input('Please enter your metacall token');
		}
	}
	if (expiresIn(token) < config.renewTime) {
		// token expires in < renewTime
		token = await refresh(token, config.baseURL);
	}
	await save({ token });

	const subscriptions = await listSubscriptions(token);
	console.log(subscriptions);
})();
