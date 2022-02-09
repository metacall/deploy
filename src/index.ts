#!/usr/bin/env node
import { promises as fs } from 'fs';
import { LanguageId, MetaCallJSON } from 'metacall-protocol/deployment';
import {
	generateJsonsFromFiles,
	generatePackage,
	PackageError
} from 'metacall-protocol/package';
import { Plans } from 'metacall-protocol/plan';
import API from 'metacall-protocol/protocol';
import { basename, join } from 'path';
import { parse } from 'ts-command-line-args';
import { input } from './cli/inputs';
import { error, info, printLanguage, warn } from './cli/messages';
import Progress from './cli/progress';
import {
	fileSelection,
	languageSelection,
	planSelection
} from './cli/selection';
import { startup } from './startup';
import { zip } from './utils';

enum ErrorCode {
	Ok = 0,
	NotDirectoryRootPath = 1,
	EmptyRootPath = 2,
	NotFoundRootPath = 3,
	AccountDisabled = 4
}

interface CLIArgs {
	workdir: string;
	projectName: string;
	email?: string;
	password?: string;
	token?: string;
	force: boolean;
	plan?: Plans;
	confDir?: string;
}

const parsePlan = (planType: string): Plans | undefined => {
	if (Object.keys(Plans).includes(planType)) {
		return Plans[planType as keyof typeof Plans];
	}
};

export const args = parse<CLIArgs>({
	workdir: { type: String, alias: 'w', defaultValue: process.cwd() },
	projectName: {
		type: String,
		alias: 'n',
		defaultValue: basename(process.cwd())
	},
	email: { type: String, alias: 'e', optional: true },
	password: { type: String, alias: 'p', optional: true },
	token: { type: String, alias: 't', optional: true },
	force: { type: Boolean, alias: 'f', defaultValue: false },
	plan: { type: parsePlan, alias: 'P', optional: true },
	confDir: { type: String, alias: 'd', optional: true }
});

void (async () => {
	const rootPath = args['workdir'];
	const name = args['projectName'];

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
		const config = await startup();
		const descriptor = await generatePackage(rootPath);
		const deploy = async (additionalJsons: MetaCallJSON[]) => {
			// TODO: We should cache the plan and ask for it only once
			const plan =
				args['plan'] ||
				(await planSelection('Please select plan from the list'));

			const api = API(config.token as string, config.baseURL);
			const enabled = await api.deployEnabled();

			if (!enabled) {
				error('Your account is not enabled to deploy');
				return process.exit(ErrorCode.AccountDisabled);
			}

			const { progress, pulse } = Progress();

			const archive = await zip(
				rootPath,
				descriptor.files,
				progress,
				pulse
			);

			// TODO: We should do something with the return value, for example
			// check for error or show the output to the user
			await api.upload(
				name,
				archive,
				additionalJsons,
				descriptor.runners
			);

			// TODO: We can ask for environment variables here too and cache them
			/*
			const { enableEnv } = await prompt<{ enableEnv: boolean }>([
				{
					type: 'confirm',
					name: 'enableEnv',
					message: 'Add env vars?',
					default: false
				}
			]);
			const env = enableEnv
				? await prompt<{ env: string }>([
						{
							type: 'input',
							name: 'env',
							message: 'Type env vars in the format: K1=V1, K2=V2'
						}
				]).then(({ env }) =>
						env
							.split(',')
							.map(kv => {
								const [k, v] = kv.trim().split('=');
								return { [k]: v };
							})
							.reduce((obj, kv) => Object.assign(obj, kv), {})
				)
				: {};
			*/

			info(`Deploying ${rootPath}...\n`);

			// TODO: We should do something with the return value, for example
			// check for error or show the output to the user
			await api.deploy(name, [], plan);

			// TODO: Anything more? Showing logs... or wait to be ready?
		};

		const createJsonAndDeploy = async (saveConsent: string) => {
			const potentialPackages = generateJsonsFromFiles(descriptor.files);
			const potentialLanguages = Array.from(
				new Set<LanguageId>(
					potentialPackages.reduce<LanguageId[]>(
						(langs, pkg) => [...langs, pkg.language_id],
						[]
					)
				)
			);

			const languages = await languageSelection(potentialLanguages);
			const packages = potentialPackages.filter(pkg =>
				languages.includes(pkg.language_id)
			);

			for (const pkg of packages) {
				pkg.scripts = await fileSelection(
					`Select files to load with ${printLanguage(
						pkg.language_id
					)}`,
					pkg.scripts
				);
			}

			if (saveConsent.toUpperCase() === 'Y')
				for (const pkg of packages) {
					await fs.writeFile(
						join(rootPath, `metacall.json`),
						JSON.stringify(pkg, null, 2)
					);
				}

			await deploy(saveConsent.toUpperCase() === 'Y' ? [] : packages);
		};

		switch (descriptor.error) {
			case PackageError.None: {
				await deploy([]);
				break;
			}
			case PackageError.Empty: {
				error(`The directory you specified (${rootPath}) is empty`);
				return process.exit(ErrorCode.EmptyRootPath);
			}
			case PackageError.JsonNotFound: {
				warn(
					`No metacall.json was found in ${rootPath}, launching the wizard`
				);

				const askToCachePackagesFile = (): Promise<string> =>
					input('Do you want to save metacall.json file? (Y/N): ');

				await createJsonAndDeploy(await askToCachePackagesFile());
				break;
			}
		}
	} catch (e) {
		console.error(e);
	}
})();
