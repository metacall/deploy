#!/usr/bin/env node
import { AxiosError } from 'axios';
import { refresh, validate, deployEnabled, listSubscriptions, inspect, deployDelete } from './protocol/api';
import { maskedInput } from './cli';
import { load, save } from './config';
import { expiresIn } from './token';
import { forever, opt, warn } from './utils';

void (async () => {
	const config = await load();
	const askToken = async () => maskedInput('Please enter your metacall token');

	let token = config.token || await askToken();

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

	// Deploy Enabled
	const enabled = await deployEnabled(token);
	console.log(enabled);

	// Subscriptions
	const subscriptions = await listSubscriptions(token);
	console.log(subscriptions);

	// Inspect
	const inspectData = await inspect(token);
	console.log(JSON.stringify(inspectData));

	// Delete Deploy
	if (inspectData.length > 0) {
		const { prefix, suffix, version } = inspectData[0];
		const result = await deployDelete(token, prefix, suffix, version);
		console.log(result);
	}
})();
