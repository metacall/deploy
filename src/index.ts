#!/usr/bin/env node
import { promises as fs } from 'fs';
import args from './cli/args';
import { inspect } from './cli/inspect';
import { error } from './cli/messages';
import { deleteBySelection } from './delete';
import { deployFromRepository, deployPackage } from './deploy';
import { force } from './force';
import { plan } from './plan';
import { startup } from './startup';

export enum ErrorCode {
	Ok = 0,
	NotDirectoryRootPath = 1,
	EmptyRootPath = 2,
	NotFoundRootPath = 3,
	AccountDisabled = 4
}

void (async () => {
	const config = await startup(args['confDir']);

	if (args['inspect']) return await inspect(config);

	if (args['delete']) return await deleteBySelection(config);

	if (args['force']) await force(config);

	if (args['addrepo']) {
		try {
			return await deployFromRepository(
				config,
				await plan(config),
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
			await deployPackage(rootPath, config, await plan(config));
		} catch (e) {
			error(String(e));
		}
	}

	if (args['serverUrl']) {
		config.baseURL = args['serverUrl'];
	}
})();
