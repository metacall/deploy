import { error } from './cli/messages';
import { promises as fs } from 'fs';
import { platform } from 'os';
import { join } from 'path';

const missing = (name: string): string =>
	`Missing ${name} environment variable! Unable to load config`;

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
