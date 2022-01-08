#!/usr/bin/env node
import { promises as fs } from 'fs';
import { LanguageId } from 'metacall-protocol/deployment';
import {
	generateJsonsFromFiles,
	generatePackage,
	PackageError
} from 'metacall-protocol/package';
import { Plans } from 'metacall-protocol/plan';
import { parse } from 'ts-command-line-args';
import { error, info, printLanguage, warn } from './cli/messages';
import {
	fileSelection,
	languageSelection,
	planSelection
} from './cli/selection';
// import { startup } from './startup';

enum ErrorCode {
	Ok = 0,
	NotDirectoryRootPath = 1,
	EmptyRootPath = 2,
	NotFoundRootPath = 3
}

interface CLIArgs {
	workdir: string;
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
	email: { type: String, alias: 'e', optional: true },
	password: { type: String, alias: 'p', optional: true },
	token: { type: String, alias: 't', optional: true },
	force: { type: Boolean, alias: 'f', defaultValue: false },
	plan: { type: parsePlan, alias: 'P', optional: true },
	confDir: { type: String, alias: 'd', optional: true }
});

void (async () => {
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
		// TODO:
		// const config = await startup();
		const descriptor = await generatePackage(rootPath);

		switch (descriptor.error) {
			case PackageError.None: {
				info(`Deploying ${rootPath}...\n`);
				const plan =
					args['plan'] ||
					(await planSelection('Please select plan from the list'));
				info(`Deploying ${JSON.stringify(descriptor.jsons)}...\n`);
				// TODO: Deploy package directly
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
				const potentialPackages = generateJsonsFromFiles(
					descriptor.files
				);
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

				/*
interface PackageDescriptor {
    error: PackageError;
    files: string[];
    jsons: string[];
    runners: string[];
}
				*/

				console.log(packages);
				// console.log(languages);
				//const scripts = await fileSelection(descriptor.files);
				//console.log(descriptor.files);
				//console.log(descriptor.runners);
				break;
			}
		}
	} catch (e) {
		console.error(e);
	}
})();
/*
import { promises as fs } from 'fs';
import { prompt } from 'inquirer';
import type { LanguageId } from 'metacall-protocol/deployment';
import { findFiles } from 'metacall-protocol/package';

const matches: Record<LanguageId, RegExp> = {
    node: /^.*\.jsx?$/i,
    ts: /^.*\.tsx?$/i,
    rb: /^.*\.rb$/i,
    py: /^.*\.py$/i,
    cs: /^.*\.cs$/i,
    cob: /^.*\.cob$/i,
    file: /^.*$/,
    rpc: /^.*$/
};

type MetacallJSON = {
    language_id: LanguageId;
    path: string;
    scripts: string[];
};

const findFilesFileSystem = (dir = '.') =>
    findFiles(
        dir,
        (dir: string) => fs.readdir(dir),
        async (path: string) => (await fs.stat(path)).isDirectory()
    );

const selectLangs = async () => {
    const def = (await fs.readdir('.'))
        .filter(x => x.startsWith('metacall-') && x.endsWith('.json'))
        .map(x => x.split('metacall-')[1].split('.json')[0] as LanguageId);
    return prompt<{ langs: LanguageId[] }>([
        {
            type: 'checkbox',
            name: 'langs',
            message: 'Select languages to run on Metacall',
            choices: ['node', 'ts', 'rb', 'py', 'cs', 'cob', 'file', 'rpc'],
            default: def
        }
    ]);
};
*/
/*
import { findFilesPath } from 'metacall-protocol/package';

void (async () => {
	//const { langs } = await selectLangs();
	const allFiles = await findFilesPath();
    for (const lang of langs) {
        const fromDisk = JSON.parse(
            await fs.readFile(`metacall-${lang}.json`, 'utf8').catch(() => '{}')
        ) as Partial<MetacallJSON>;
        const { scripts } = await prompt<{ scripts: string[] }>([
            {
                type: 'checkbox',
                name: 'scripts',
                message: `Select files to load with ${lang}`,
                choices: [
                    ...new Set([
                        ...allFiles.filter(file => matches[lang].test(file)),
                        ...(fromDisk.scripts ?? [])
                    ])
                ],
                default: fromDisk.scripts ?? []
            }
        ]);

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
        console.log(env);
        await fs.writeFile(
            `metacall-${lang}.json`,
            JSON.stringify(
                {
                    ...fromDisk,
                    language_id: lang,
                    path: fromDisk.path ?? '.',
                    scripts: [
                        ...new Set([
                            ...(fromDisk.scripts ?? []),
                            ...(scripts ?? [])
                        ])
                    ]
                },
                null,
                2
            )
        );
    }
})();
*/
