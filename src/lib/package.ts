import walk from 'ignore-walk';
import { basename } from 'path';
import { Languages } from './language';

export const findFilesPath = async (
	path: string = process.cwd(),
	ignoreFiles: string[] = ['.gitignore']
): Promise<string[]> =>
	(
		await walk({
			path,
			ignoreFiles,
			includeEmpty: true,
			follow: true
		})
	).filter(x => !x.startsWith('.git'));

const pathIsMetaCallJson = (path: string): boolean =>
	!!/^metacall(-.+)?\.json$/.exec(basename(path));

export const findMetaCallJsons = (files: string[]): string[] =>
	files.filter(pathIsMetaCallJson);

type LanguageIds = keyof typeof Languages;

export const findRunners = (files: string[]): Set<LanguageIds> => {
	const runners: Set<LanguageIds> = new Set<LanguageIds>();

	for (const file of files) {
		for (const langId of Object.keys(Languages)) {
			for (const re of Languages[langId as LanguageIds]
				.runnerFilesRegexes) {
				if (re.exec(file)) {
					runners.add(langId as LanguageIds);
				}
			}
		}
	}

	return runners;
};
