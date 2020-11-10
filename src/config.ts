import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { parse, stringify } from 'ini';
import { platform } from 'os';
import { join } from 'path';
import { fatal } from './utils';

export const defaultPath =
	platform() === 'win32'
		? process.env.APPDATA
			? join(process.env.APPDATA, 'metacall-upload')
			: fatal(
					'Missing APPDATA environment variable! Unable to load config'
			  )
		: process.env.HOME
		? join(process.env.HOME, '.metacall-upload')
		: fatal('Missing HOME environment variable! Unable to load config');

const ensureFolderExists = (path: string) => (
	existsSync(path) || mkdirSync(path), path
);

const loadFile = (path: string) =>
	existsSync(path) ? readFileSync(path, 'utf8') : '';

export const load = (path = defaultPath) =>
	parse(loadFile(join(ensureFolderExists(path), 'config.ini')));

export const save = (data: any, path = defaultPath) =>
	writeFileSync(
		join(ensureFolderExists(path), 'config.ini'),
		stringify(data)
	);
