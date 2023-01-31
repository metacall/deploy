#!/usr/bin/env node
import { Plans } from '@metacall/protocol/plan';
import API, { API as APIInterface } from '@metacall/protocol/protocol';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import args, { InspectFormat } from './cli/args';
import { inspect } from './cli/inspect';
import { error } from './cli/messages';
import { handleUnknownArgs } from './cli/unknown';
import validateToken from './cli/validateToken';
import { deleteBySelection } from './delete';
import { deployFromRepository, deployPackage, ErrorCode } from './deploy';
import { force } from './force';
import { listPlans } from './listPlans';
import { logout } from './logout';
import { plan } from './plan';
import { startup } from './startup';

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
	const api: APIInterface = API(
		config.token as string,
		args['dev'] ? config.devURL : config.baseURL
	);

	await validateToken(api);

	if (args['listPlans']) return await listPlans(api);

	if (args['inspect'] === null) {
		args['inspect'] = InspectFormat.Table;
	}
	if (args['inspect']) return await inspect(args['inspect'], config, api);

	if (args['delete']) return await deleteBySelection(api);

	if (args['force']) await force(api);

	// On line 63, we passed Essential to the FAAS in dev environment,
	// the thing is there is no need of plans in Local Faas (--dev),
	// this could have been handlled neatly if we created deploy as a State Machine,
	// think about a better way

	const planSelected: Plans = args['dev'] ? Plans.Essential : await plan(api);

	if (args['addrepo']) {
		try {
			return await deployFromRepository(
				api,
				planSelected,
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
				return error(
					`Invalid root path, ${rootPath} is not a directory.`,
					ErrorCode.NotDirectoryRootPath
				);
			}
		} catch (e) {
			return error(
				`Invalid root path, ${rootPath} not found.`,
				ErrorCode.NotFoundRootPath
			);
		}

		try {
			await deployPackage(rootPath, api, planSelected);
		} catch (e) {
			error(String(e));
		}
	}

	if (args['serverUrl']) {
		config.baseURL = args['serverUrl'];
	}
})();

// change all flag names to toUpperCase
// think of a way to write test for --dev flag
