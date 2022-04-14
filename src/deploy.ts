import { promises as fs } from 'fs';
import { LanguageId, MetaCallJSON } from 'metacall-protocol/deployment';
import {
	findRunners,
	generateJsonsFromFiles,
	generatePackage,
	PackageError
} from 'metacall-protocol/package';
import { Plans } from 'metacall-protocol/plan';
import API, { ProtocolError } from 'metacall-protocol/protocol';
import { join } from 'path';
import args from './cli/args';
import { input } from './cli/inputs';
import { apiError, error, info, printLanguage, warn } from './cli/messages';
import Progress from './cli/progress';
import {
	fileSelection,
	languageSelection,
	listSelection
} from './cli/selection';
import { Config } from './config';
import { logs } from './logs';
import { zip } from './utils';

enum ErrorCode {
	Ok = 0,
	NotDirectoryRootPath = 1,
	EmptyRootPath = 2,
	NotFoundRootPath = 3,
	AccountDisabled = 4
}

export const deployPackage = async (
	rootPath: string,
	config: Config,
	plan: Plans
) => {
	try {
		const name = args['projectName'].toLowerCase();
		let descriptor = await generatePackage(rootPath);

		const deploy = async (additionalJsons: MetaCallJSON[]) => {
			// TODO: We should cache the plan and ask for it only once
			const api = API(
				config.token as string,
				args['dev'] ? config.devURL : config.baseURL
			);
			const descriptor = await generatePackage(rootPath);

			const { progress, pulse, hide } = Progress();

			const archive = await zip(
				rootPath,
				descriptor.files,
				progress,
				pulse,
				hide
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

			try {
				await api.deploy(name, [], plan, 'Package');

				await logs(descriptor.runners, name, args['dev']);
			} catch (err) {
				if (
					(err as ProtocolError).response?.data ===
					`The ${plan} plan is not available.`
				)
					return warn(
						`There is already a deployment on ${plan} plan. If you still wanted to deploy, Wirte the previous command with --force flag.`
					);
				apiError(err as ProtocolError);
			}

			// TODO: Need a TUI for logs
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
		error(String(e));
	}
};

export const deployFromRepository = async (
	config: Config,
	plan: Plans,
	url: string
) => {
	const api = API(
		config.token as string,
		args['dev'] ? config.devURL : config.baseURL
	);

	try {
		const { branches } = await api.branchList(url);

		if (!branches.length) return error('Invalid Repository URL');

		// TODO: API response type should be created in protocol, it is string as of now

		const selectedBranch = await listSelection(branches, 'Select branch :');

		const runners = Array.from(
			findRunners(await api.fileList(url, selectedBranch))
		);

		const name = (await api.add(url, selectedBranch, [])).id;

		const deploy = await api.deploy(name, [], plan, 'Repository');

		info('Deploying...');

		await logs(runners, deploy.suffix, args['dev']);

		info('Repository deployed');
	} catch (e) {
		if (
			(e as ProtocolError).response?.data ===
			`The ${plan} plan is not available.`
		)
			return warn(
				`There is already a deployment on ${plan} plan. If you still wanted to deploy, Wirte the previous command with --force flag.`
			);
		error(String(e));
	}
};
