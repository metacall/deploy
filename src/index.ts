#!/usr/bin/env node
import { promises as fs } from 'fs';
import { Deployment } from 'metacall-protocol/deployment';
import API from 'metacall-protocol/protocol';
import args from './cli/args';
import { inspect } from './cli/inspect';
import { error } from './cli/messages';
import { listSelection, planSelection } from './cli/selection';
import { load } from './config';
import { del } from './delete';
import { deployFromRepository, deployPackage } from './deploy';
import { startup } from './startup';

enum ErrorCode {
	Ok = 0,
	NotDirectoryRootPath = 1,
	EmptyRootPath = 2,
	NotFoundRootPath = 3,
	AccountDisabled = 4
}

void (async () => {
	if (args['inspect']) return await inspect();

	if (args['delete']) {
		const config = await startup();
		const api = API(config.token as string, config.baseURL);

		try {
			const deployments: Deployment[] = (await api.inspect()).filter(
				dep => dep.status === 'ready'
			);
			if (!deployments.length) error('No deployment found');

			const project: string = await listSelection(
				[...deployments.map(el => `${el.suffix} ${el.version}`)],
				'Select the deployment to delete :-'
			);

			const app = deployments.filter(
				dep =>
					dep.suffix === project.split(' ')[0] &&
					dep.version === project.split(' ')[1]
			)[0];

			return await del(app.prefix, app.suffix, app.version);
		} catch (err) {
			error(String(err));
		}
	}

	// TODO: We should cache the plan and ask for it only once
	const plan =
		args['plan'] ||
		(await planSelection('Please select plan from the list'));

	const config = await startup();

	if (args['addrepo']) {
		try {
			return await deployFromRepository(
				config,
				plan,
				new URL(args['addrepo']).href
			);
		} catch (e) {
			error(String(e));
		}
	}

	// If workdir is passed call than deploy using package
	if (args['workdir']) {
		const rootPath = args['workdir'];

		try {
			if (!(await fs.stat(rootPath)).isDirectory()) {
				error(`Invalid root path, ${rootPath} is not a directory.`);
				return process.exit(ErrorCode.NotDirectoryRootPath);
			}
		} catch (e) {
			error(`Invalid root path, ${rootPath} not found.`);
			return process.exit(ErrorCode.NotFoundRootPath);
		}

		try {
			await deployPackage(rootPath, config, plan);
		} catch (e) {
			error(String(e));
		}
	}

	// If configdir is passed call than add its value to the load operation
	if (args['confDir']) {
		const configPath = args['confDir'];
		try {
			const new_config = await load(configPath);
		} catch (e) {
			error(`Invalid config path, ${configPath} not found.`);
			return process.exit(ErrorCode.NotFoundRootPath);
		}
	}

	if (args['serverUrl']) {
		const serverUrl = args['serverUrl'];
		config.baseURL = serverUrl;
	}
})();
