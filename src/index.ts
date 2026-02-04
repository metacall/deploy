#!/usr/bin/env node
import { Plans } from '@metacall/protocol/plan';
import API, { API as APIInterface } from '@metacall/protocol/protocol';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import args, { InspectFormat } from './cli/args';
import { inspect } from './cli/inspect';
import {
	debug,
	error,
	info,
	jsonOutput,
	setOutputMode,
	success
} from './cli/messages';
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
	// Initialize output mode based on CLI flags
	if (args['json']) {
		setOutputMode('json');
	} else if (args['quiet']) {
		setOutputMode('quiet');
	} else if (args['verbose']) {
		setOutputMode('verbose');
	}

	if (args['_unknown'].length) handleUnknownArgs();

	if (args['version']) {
		const version = (
			(await import(
				join(
					require.main
						? join(dirname(require.main.filename), '..')
						: process.cwd(),
					'package.json'
				)
			)) as { version: string }
		).version;

		if (args['json']) {
			jsonOutput({ version });
		} else {
			console.log(`v${version}`);
		}
		return;
	}

	if (args['logout']) return logout();

	const config = await startup(args['confDir']);
	const api: APIInterface = API(
		config.token as string,
		args['dev'] ? config.devURL : config.baseURL
	);

	debug(
		`Using API endpoint: ${args['dev'] ? config.devURL : config.baseURL}`
	);

	await validateToken(api);

	if (args['listPlans']) return await listPlans(api);

	if (args['inspect'] === null) {
		args['inspect'] = InspectFormat.Table;
	}
	if (args['inspect']) return await inspect(args['inspect'], config, api);

	if (args['delete']) return await deleteBySelection(api);

	if (args['force']) await force(api);

	const planSelected: Plans = args['dev'] ? Plans.Essential : await plan(api);

	debug(`Selected plan: ${planSelected}`);

	// Handle dry-run mode
	if (args['dryRun']) {
		info('Dry-run mode enabled. No deployment will be made.');
	}

	if (args['addrepo']) {
		try {
			const repoUrl = new URL(args['addrepo']).href;

			if (args['dryRun']) {
				info(`Would deploy repository: ${repoUrl}`);
				info(`Plan: ${planSelected}`);
				if (args['env']?.length) {
					info(
						`Environment variables: ${args['env'].length} specified`
					);
				}
				jsonOutput({
					dryRun: true,
					action: 'deployRepository',
					repository: repoUrl,
					plan: planSelected,
					envCount: args['env']?.length || 0
				});
				return;
			}

			return await deployFromRepository(api, planSelected, repoUrl);
		} catch (e) {
			error(String(e));
		}
	}

	// If workdir is passed, deploy using package
	if (args['workdir']) {
		const rootPath = args['workdir'];

		debug(`Deploying from directory: ${rootPath}`);

		try {
			if (!(await fs.stat(rootPath)).isDirectory()) {
				return error(
					`Invalid root path: "${rootPath}" is not a directory.`,
					ErrorCode.NotDirectoryRootPath
				);
			}
		} catch (e) {
			return error(
				`Invalid root path: "${rootPath}" not found.`,
				ErrorCode.NotFoundRootPath
			);
		}

		if (args['dryRun']) {
			const files = await fs.readdir(rootPath);
			info(`Would deploy directory: ${rootPath}`);
			info(`Project name: ${args['projectName']}`);
			info(`Plan: ${planSelected}`);
			info(`Files in directory: ${files.length}`);
			if (args['env']?.length) {
				info(`Environment variables from CLI: ${args['env'].length}`);
			}
			if (args['envFile']?.length) {
				info(`Environment files: ${args['envFile'].join(', ')}`);
			}
			if (args['ignore']?.length) {
				info(`Ignore patterns: ${args['ignore'].join(', ')}`);
			}
			jsonOutput({
				dryRun: true,
				action: 'deployPackage',
				directory: rootPath,
				projectName: args['projectName'],
				plan: planSelected,
				fileCount: files.length,
				envCount: args['env']?.length || 0,
				envFiles: args['envFile'] || [],
				ignorePatterns: args['ignore'] || []
			});
			return;
		}

		try {
			await deployPackage(rootPath, api, planSelected);
			success('Deployment completed successfully!');
		} catch (e) {
			error(String(e));
		}
	}

	if (args['serverUrl']) {
		config.baseURL = args['serverUrl'];
	}
})();
