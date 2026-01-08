import { promises as fs } from 'fs';
import { basename, join } from 'path';
import { platform } from 'os';
import { MetaCallJSON } from '@metacall/protocol/deployment';
import { selectFile } from '../ui/prompts';
import { printLanguage } from './languageUtils';

export const configDir = (name: string): string => {
	if (platform() === 'win32') {
		if (process.env.APPDATA) {
			return join(process.env.APPDATA, name);
		}
		throw new Error('Missing APPDATA environment variable');
	}

	if (process.env.HOME) {
		return join(process.env.HOME, `.${name}`);
	}

	throw new Error('Missing HOME environment variable');
};

export const exists = async (path: string): Promise<boolean> => {
	try {
		await fs.stat(path);
		return true;
	} catch {
		return false;
	}
};

export const isDirectory = async (path: string): Promise<boolean> => {
	try {
		const stat = await fs.stat(path);
		return stat.isDirectory();
	} catch {
		return false;
	}
};

export const ensureFolderExists = async <Path extends string>(path: Path): Promise<Path> => {
	if (!(await exists(path))) {
		await fs.mkdir(path, { recursive: true });
	}
	return path;
};

export const loadFile = async (path: string): Promise<string> => {
	if (await exists(path)) {
		return fs.readFile(path, 'utf8');
	}
	return '';
};

export const getDefaultProjectName = (workdir: string): string => {
	return basename(workdir);
};

export async function loadFilesToRun(packages: MetaCallJSON[]): Promise<void> {
	for (const pkg of packages) {
		if (pkg.scripts && pkg.scripts.length > 0) {
			pkg.scripts = await selectFile(pkg.scripts, `Select files to load with ${printLanguage(pkg.language_id)}`);
		}
	}
}
