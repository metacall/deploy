#!/usr/bin/env node
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import args from './cli/args';
import { inspect } from './cli/inspect';
import { error, info } from './cli/messages';
import { handleUnknownArgs } from './cli/unknown';
import { validateToken } from './cli/validateToken';
import { deleteBySelection } from './delete';
import { deployFromRepository, deployPackage } from './deploy';
import { force } from './force';
import { listPlans } from './listPlans';
import { logout } from './logout';
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
	if (args['_unknown'].length) handleUnknownArgs();

	if (args['version']) {
		return console.log(
			(
				(await import(
					join(
						require.main
							? join(dirname(require.main.filename), '..')
							: process.cwd(),
						'package.json'
					)
				)) as { version: string }
			).version
		);
	}

	if (args['logout']) return logout();

	const config = await startup(args['confDir']);

	try {
		await validateToken(config);
	} catch (err) {
		info('Try login again!');
		error(
			`Token Validation Failed, Potential Causes Include:-\n1) The JWT may be mistranslated (Invalid Signature).\n2) JWT might have expired.`
		);
	}

	if (args['listPlans']) return await listPlans(config);

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

// change all flag names to toUpperCase
// If we have metacall.json file saved, then deployer directly deploys the application based on that json, but it should be asked
// add test for user should not deploy without selecting files
