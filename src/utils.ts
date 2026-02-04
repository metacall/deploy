/*

* About File:
	it contains utility functions to deal with files/folders and zipping filed

*/

import { MetaCallJSON } from '@metacall/protocol/deployment';
import archiver, { Archiver } from 'archiver';
import { parse } from 'dotenv';
import { promises as fs } from 'fs';
import { prompt } from 'inquirer';
import { platform } from 'os';
import { basename, join, relative } from 'path';
import { error, info, printLanguage, warn } from './cli/messages';
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

/**
 * Filter files based on ignore patterns (glob-style)
 * Supports patterns like: *.log, node_modules, *.test.js, etc.
 */
export const filterFiles = (
	files: string[],
	ignorePatterns?: string[]
): string[] => {
	if (!ignorePatterns || ignorePatterns.length === 0) {
		return files;
	}

	// Convert glob patterns to regex
	const patterns = ignorePatterns.map(pattern => {
		// Escape regex special chars except * and ?
		const regexStr = pattern
			.replace(/[.+^${}()|[\]\\]/g, '\\$&')
			.replace(/\*/g, '.*')
			.replace(/\?/g, '.');

		// Match the pattern anywhere in the path
		return new RegExp(`(^|/)${regexStr}($|/)`);
	});

	return files.filter(file => {
		// Keep file if it doesn't match any ignore pattern
		return !patterns.some(pattern => pattern.test(file));
	});
};

export const zip = async (
	source: string,
	files: string[],
	progress?: (text: string, bytes: number) => void,
	pulse?: (name: string) => void,
	hide?: () => void,
	ignorePatterns?: string[]
): Promise<Archiver> => {
	// Apply ignore patterns
	files = filterFiles(files, ignorePatterns);
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

/**
 * Parse a single KEY=VALUE string into an object entry
 */
const parseEnvString = (
	envStr: string
): { name: string; value: string } | null => {
	const eqIndex = envStr.indexOf('=');
	if (eqIndex === -1) {
		return null;
	}
	const name = envStr.substring(0, eqIndex).trim();
	const value = envStr.substring(eqIndex + 1).trim();
	if (!name) {
		return null;
	}
	return { name, value };
};

/**
 * Load environment variables from a .env file
 */
const loadEnvFile = async (
	filePath: string,
	silent = false
): Promise<{ name: string; value: string }[]> => {
	if (!(await exists(filePath))) {
		if (!silent) {
			warn(`Environment file not found: ${filePath}`);
		}
		return [];
	}

	try {
		const source = await fs.readFile(filePath, 'utf8');
		const parsedEnv = parse(source);
		if (!silent) {
			info(`Loaded environment variables from ${filePath}`);
		}
		return Object.entries(parsedEnv).map(([name, value]) => ({
			name,
			value
		}));
	} catch (err) {
		if (!silent) {
			warn(
				`Error reading environment file ${filePath}: ${
					(err as Error).message
				}`
			);
		}
		return [];
	}
};

/**
 * Get environment variables from multiple sources:
 * 1. CLI --env flags (highest priority)
 * 2. CLI --envFile flags
 * 3. Project .env file (if rootPath provided)
 * 4. Interactive prompt (if TTY available)
 */
export const getEnv = async (
	rootPath?: string,
	cliEnvVars?: string[],
	cliEnvFiles?: string[]
): Promise<{ name: string; value: string }[]> => {
	const envMap = new Map<string, string>();

	// 1. Load from project .env file (lowest priority, will be overwritten)
	if (rootPath !== undefined) {
		const defaultEnvPath = join(rootPath, '.env');
		const defaultEnvVars = await loadEnvFile(defaultEnvPath, true);
		for (const { name, value } of defaultEnvVars) {
			envMap.set(name, value);
		}
		if (defaultEnvVars.length > 0) {
			info(
				`Detected ${defaultEnvVars.length} environment variable(s) from .env file`
			);
		}
	}

	// 2. Load from --envFile flags (medium priority)
	if (cliEnvFiles && cliEnvFiles.length > 0) {
		for (const filePath of cliEnvFiles) {
			const fileEnvVars = await loadEnvFile(filePath);
			for (const { name, value } of fileEnvVars) {
				envMap.set(name, value);
			}
		}
	}

	// 3. Load from --env flags (highest priority, overwrites others)
	if (cliEnvVars && cliEnvVars.length > 0) {
		for (const envStr of cliEnvVars) {
			const parsed = parseEnvString(envStr);
			if (parsed) {
				envMap.set(parsed.name, parsed.value);
			} else {
				warn(
					`Invalid environment variable format: "${envStr}". Expected KEY=VALUE`
				);
			}
		}
		info(`Applied ${cliEnvVars.length} environment variable(s) from CLI`);
	}

	// 4. If we already have env vars from files/CLI, return them
	if (envMap.size > 0) {
		return Array.from(envMap.entries()).map(([name, value]) => ({
			name,
			value
		}));
	}

	// 5. If no env vars and not interactive, return empty
	if (!isInteractive()) {
		return [];
	}

	// 6. Interactive prompt for env vars
	const enableEnv = await consentSelection(
		'Do you want to add environment variables?'
	);

	if (!enableEnv) {
		return [];
	}

	const { env } = await prompt<{ env: string }>([
		{
			type: 'input',
			name: 'env',
			message: 'Type env vars in the format: K1=V1, K2=V2'
		}
	]);

	const envEntries = env
		.split(',')
		.map(kv => parseEnvString(kv.trim()))
		.filter(
			(entry): entry is { name: string; value: string } => entry !== null
		);

	return envEntries;
};
