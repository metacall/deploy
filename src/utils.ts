/*

* About File:
	it contains utility functions to deal with files/folders and zipping filed

*/

import archiver, { Archiver } from 'archiver';
import { promises as fs } from 'fs';
import { platform } from 'os';
import { basename, join } from 'path';
import { error } from './cli/messages';

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

export const zip = async (
	source: string,
	files: string[],
	progress: (text: string, bytes: number) => void,
	pulse: (name: string) => void
): Promise<Archiver> => {
	const archive = archiver('zip', {
		zlib: { level: 9 }
	});
	archive.on('progress', data =>
		progress(
			'Compressing and deploying...',
			data.fs.processedBytes / data.fs.totalBytes
		)
	);
	archive.on('entry', entry => pulse(entry.name));

	files = files.map(file => join(source, file));

	for (const file of files) {
		(await fs.stat(file)).isDirectory()
			? archive.directory(file, basename(file))
			: archive.file(file, { name: basename(file) });
	}

	await archive.finalize();

	return archive;
};
