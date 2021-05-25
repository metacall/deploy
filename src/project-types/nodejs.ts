import { existsSync, readFileSync } from 'fs';
import glob from 'glob';
import { join } from 'path';

const match = (path: string, patterns: string[]): Promise<string[]> =>
	!Array.isArray(patterns)
		? match(path, [patterns])
		: Promise.all(
				patterns.map(
					pattern =>
						new Promise<string[]>((resolve, reject) =>
							glob(pattern, { cwd: path }, (err, matches) =>
								err ? reject(err) : resolve(matches)
							)
						)
				)
		  ).then(list => list.flat());

const matchFile = (path: string, file: string) =>
	match(
		path,
		readFileSync(file, 'utf8')
			.trim()
			.split(/[\r\n]/)
	);

export const ignore = async (path: string): Promise<string[]> => [
	'node_modules',
	...(await (existsSync(join(path, '.npmignore'))
		? matchFile(path, join(path, '.npmignore'))
		: existsSync(join(path, '.gitignore'))
		? matchFile(path, join(path, '.gitignore'))
		: []))
];

export const metacall = (
	scripts: string[],
	pack: { main: string }
): { language_id: string; path: string; scripts: string[] } => ({
	language_id: 'node',
	path: '.',
	scripts: [...scripts, ...(scripts.length === 0 ? [pack.main] : [])]
});
