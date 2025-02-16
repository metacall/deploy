/*

* About File:
	it contains utility functions to deal with files/folders and zipping filed

*/

import { MetaCallJSON } from '@metacall/protocol/deployment';
import archiver, { Archiver } from 'archiver';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import { prompt } from 'inquirer';
import { platform } from 'os';
import { basename, join, relative } from 'path';
import { error, printLanguage } from './cli/messages';
import { consentSelection, fileSelection } from './cli/selection';
import { isInteractive } from './tty';

const missing = (name: string): string =>
	`Missing ${name} environment variable! Unable to load config`;

export const sleep = (ms: number) => {
	return new Promise(resolve => setTimeout(resolve, ms));
};

export const configDir = (name: string): string =>
	platform() === 'win32'
		? process.env.APPDATA
			? join(process.env.APPDATA, name)
			: error(missing('APPDATA'))
		: process.env.HOME
		? join(process.env.HOME, `.${name}`)
		: error(missing('HOME'));

export const exists = (path: string): Promise<boolean> =>
	fs.stat(path).then(
		() => true,
		() => false
	);

export const ensureFolderExists = async <Path extends string>(
	path: Path
): Promise<Path> => (
	(await exists(path)) || (await fs.mkdir(path, { recursive: true })), path
);

export const loadFile = async (path: string): Promise<string> =>
	(await exists(path)) ? fs.readFile(path, 'utf8') : '';

export const opt = (f: (x: string) => string, x?: string | null): string =>
	x ? f(x) : '';

export const forever = true;

export const filter = (
	a: Record<string, unknown>,
	b: Record<string, unknown>
): Record<string, unknown> =>
	Object.entries(b).reduce(
		(acc, [k, v]) => (a[k] === v ? acc : { ...acc, [k]: v }),
		{}
	);

export const loadFilesToRun = async (
	packages: MetaCallJSON[]
): Promise<void> => {
	for (const pkg of packages) {
		pkg.scripts = await fileSelection(
			`Select files to load with ${printLanguage(pkg.language_id)}`,
			pkg.scripts
		);
	}
};

export const zip = async (
	source: string,
	files: string[],
	progress?: (text: string, bytes: number) => void,
	pulse?: (name: string) => void,
	hide?: () => void
): Promise<Archiver> => {
	const archive = archiver('zip', {
		zlib: { level: 9 }
	});

	if (progress) {
		archive.on('progress', data =>
			progress(
				'Compressing and deploying...',
				data.fs.processedBytes / data.fs.totalBytes
			)
		);
	}

	if (pulse) {
		archive.on('entry', (entry: archiver.EntryData) => pulse(entry.name));
	}

	files = files.map(file => join(source, file));

	for (const file of files) {
		(await fs.stat(file)).isDirectory()
			? archive.directory(file, basename(file))
			: archive.file(file, { name: relative(source, file) });
	}

	if (hide) {
		archive.on('finish', () => hide());
	}

	await archive.finalize();

	return archive;
};

export const getEnv = async (): Promise<{ name: string; value: string }[]> => {
	const envFilePath = join(process.cwd(), '.env');
	if (await exists(envFilePath)) {
		try {
			const fileContents = await fs.readFile(envFilePath, 'utf8');
			const parsedEnv = dotenv.parse(fileContents);
			console.log(
				'Detected and loaded environment variables from .env file.'
			);
			return Object.entries(parsedEnv).map(([name, value]) => ({
				name,
				value
			}));
		} catch (err) {
			console.error('Error reading the .env file:', err);
		}
	}

	// If the input is not interactive skip asking the end user
	if (!isInteractive()) {
		// TODO: We should implement support for all the inputs and prompts for non-interactive terminal
		return [];
	}

	const enableEnv = await consentSelection(
		'Do you want to add environment variables?'
	);

	if (enableEnv) {
		const { env } = await prompt<{ env: string }>([
			{
				type: 'input',
				name: 'env',
				message: 'Type env vars in the format: K1=V1, K2=V2'
			}
		]);

		const envObject = env
			.split(',')
			.map(kv => kv.trim())
			.reduce((acc: Record<string, string>, kv) => {
				const [key, value] = kv.split('=');
				if (key && value) {
					acc[key.trim()] = value.trim();
				}
				return acc;
			}, {});

		return Object.entries(envObject).map(([name, value]) => ({
			name,
			value
		}));
	}

	return [];
};
