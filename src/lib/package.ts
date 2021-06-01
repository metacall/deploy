import { join } from 'path';

type ReadDir = (path: string) => Promise<string[]>;
// type ReadFile = (path: string) => Promise<string[]>;
type IsDirectory = (path: string) => Promise<boolean>;

export const findFiles = async (
	dir: string,
	readDir: ReadDir,
	isDirectory: IsDirectory
): Promise<string[]> =>
	([] as string[]).concat(
		...(await Promise.all(
			(
				await readDir(dir)
			).map(async file => {
				const path = dir === '.' ? file : join(dir, file);
				return (await isDirectory(path))
					? await findFiles(path, readDir, isDirectory)
					: [path];
			})
		))
	);

// const filterIgnoreFiles = async (
//     files: Promise<string[]>,
//     readFile: ReadFile
// ): Promise<string[]> => (await files).map(f => {

// });
