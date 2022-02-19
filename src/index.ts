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
	help?: boolean;
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

const cliArgsDescription: { [k: string]: string } = {
	help: 'prints help.',
	workdir: 'accepts path to application directory.',
	projectName: 'accepts name of the application.',
	email: 'accepts email id for authentication.',
	password: 'accepts password for authentication.',
	token: 'accepts token for authentication, either pass email & password or token.',
	force: 'accepts boolean value : it deletes the deployment present on an existing plan and deploys again.',
	plan: 'accepts type of plan : "Essential", "Standard", "Premium".'
};

export const args = parse<CLIArgs>(
	{
		help: {
			type: Boolean,
			optional: true,
			alias: 'h',
			description: cliArgsDescription.help
		},
		workdir: {
			type: String,
			alias: 'w',
			defaultValue: process.cwd(),
			description: cliArgsDescription.workdir
		},
		projectName: {
			type: String,
			alias: 'n',
			defaultValue: basename(process.cwd()),
			description: cliArgsDescription.projectName
		},
		email: {
			type: String,
			alias: 'e',
			optional: true,
			description: cliArgsDescription.email
		},
		password: {
			type: String,
			alias: 'p',
			optional: true,
			description: cliArgsDescription.password
		},
		token: {
			type: String,
			alias: 't',
			optional: true,
			description: cliArgsDescription.token
		},
		force: {
			type: Boolean,
			alias: 'f',
			defaultValue: false,
			description: cliArgsDescription.force
		},
		plan: {
			type: parsePlan,
			alias: 'P',
			optional: true,
			description: cliArgsDescription.plan
		},
		confDir: { type: String, alias: 'd', optional: true }
	},
	{
		helpArg: 'help',
		headerContentSections: [
			{
				header: 'Official CLI for metacall-deploy',
				content: 'Usage: metacall-deploy [--args]'
			}
		]
	}
);

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
		let descriptor = await generatePackage(rootPath);

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

			const cacheJsons = saveConsent === 'Y' || saveConsent === 'YES';

			const additionalPackages = cacheJsons
				? await (async () => {
						for (const pkg of packages) {
							await fs.writeFile(
								join(
									rootPath,
									`metacall-${pkg.language_id}.json`
								),
								JSON.stringify(pkg, null, 2)
							);
						}

						// If they are cached, genearte the descriptor again
						descriptor = await generatePackage(rootPath);

						// The descriptor already contains the packages so
						// there is no need to send additional packages
						return [];
				  })()
				: packages; // Otherwise, packages are not cached, send them

			await deploy(additionalPackages);
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

				await createJsonAndDeploy(
					(await askToCachePackagesFile()).toUpperCase()
				);
				break;
			}
		}
	} catch (e) {
		console.error(e);
	}
})();
