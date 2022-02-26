#!/usr/bin/env node
import { promises as fs } from 'fs';

import args from './cli/args';
import { ins } from './cli/inspect';
import { error } from './cli/messages';
import { planSelection } from './cli/selection';
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
	const inspect = args['inspect'];

	if (inspect) await ins();

	if (!args['workdir'] && !args['addrepo']) {
		error('Either provide work directory or repository url to deploy');
	}

	// TODO: We should cache the plan and ask for it only once
	const plan =
		args['plan'] ||
		(await planSelection('Please select plan from the list'));

	const config = await startup();

	//if addrepo is passed then deploy from repository url
	if (args['addrepo']) {
		try {
			await deployFromRepository(config, plan);
		} catch (e) {
			console.error(e);
		}
	}

	//if workdir is passed call than deploy using package
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
			await deployPackage(config, plan);
		} catch (e) {
			console.error(e);
		}
	}
})();
