/*

* About File:

	defines a package and its routines, a package is just a metacall.json with some extra details, for example, the runners needed to build a it (for example, if we find a requirements.txt then it means we need to run the python installer pip, so the python runner is needed)

	it includes ignore files (like .gitignore), it is able to list all files in a path and classify them depending on what loader is the correct for each file extension

	generatePackage is an exported function that given a path it generates all the information needed, for example, what runners are needed, what metacall-*.json are generated (depending on file extension) and the list of files that will be in that package (excluding the ones in gitignore)

	generateJsonsFromFiles is similar but it is more fine grained, it uses a list of files and returns what are the metacall-*.json generated from them

*/

import walk from 'ignore-walk';
import { basename, extname } from 'path';
import { LanguageId, MetaCallJSON } from './deployment';
import { Languages } from './language';

export const findFilesPath = async (
	path: string = process.cwd(),
	ignoreFiles: string[] = ['.gitignore']
): Promise<string[]> =>
	(
		await walk({
			path,
			ignoreFiles,
			includeEmpty: false,
			follow: true
		})
	).filter(x => !x.startsWith('.git'));

const pathIsMetaCallJson = (path: string): boolean =>
	!!/^metacall(-.+)?\.json$/.exec(basename(path));

export const findMetaCallJsons = (files: string[]): string[] =>
	files.filter(pathIsMetaCallJson);

export const findRunners = (files: string[]): Set<string> => {
	const runners: Set<string> = new Set<string>();

	for (const file of files) {
		const fileName = basename(file);
		for (const langId of Object.keys(Languages)) {
			const lang = Languages[langId as LanguageId];
			for (const re of lang.runnerFilesRegexes) {
				if (re.exec(fileName) && lang.runnerName) {
					runners.add(lang.runnerName);
				}
			}
		}
	}

	return runners;
};

export enum PackageError {
	Empty = 'No files found in the current folder',
	JsonNotFound = 'No metacall.json found in the current folder',
	None = 'Package correctly generated'
}

interface PackageDescriptor {
	error: PackageError;
	files: string[];
	jsons: string[];
	runners: string[];
}

const NullPackage: PackageDescriptor = {
	error: PackageError.None,
	files: [],
	jsons: [],
	runners: []
};

export const generatePackage = async (
	path: string = process.cwd()
): Promise<PackageDescriptor> => {
	const files = await findFilesPath(path);

	if (files.length === 0) {
		return { ...NullPackage, error: PackageError.Empty };
	}

	const jsons = findMetaCallJsons(files);

	return {
		error:
			jsons.length === 0 ? PackageError.JsonNotFound : PackageError.None,
		files,
		jsons,
		runners: Array.from(findRunners(files))
	};
};

const getExtension = (file: string) => {
	const ext = extname(file || '').split('.');
	return ext[ext.length - 1];
};

const matchFilesByLanguage = (lang: LanguageId, files: string[]): string[] =>
	files.reduce(
		(arr: string[], file: string) =>
			Languages[lang].fileExtRegex.exec(
				getExtension(file) || basename(file)
			)
				? [...arr, file]
				: arr,
		[]
	);

export const generateJsonsFromFiles = (files: string[]): MetaCallJSON[] =>
	(Object.keys(Languages) as LanguageId[]).reduce<MetaCallJSON[]>(
		(jsons, lang) => {
			const scripts = matchFilesByLanguage(lang, files);

			if (scripts.length === 0) {
				return jsons;
			} else {
				return [
					{
						language_id: lang,
						path: '.',
						scripts
					} as MetaCallJSON,
					...jsons
				];
			}
		},
		[]
	);
