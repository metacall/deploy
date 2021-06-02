import { deepStrictEqual, rejects } from 'assert';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { generatePackage, PackageError } from '../lib/package';

describe('integration package', function () {
	const basePath = join(
		process.cwd(),
		'src',
		'test',
		'resources',
		'integration',
		'package'
	);

	it('generatePackage wrong path', async () => {
		const wrongPath = join(basePath, 'this', 'does', 'not', 'exist');
		await rejects(
			generatePackage(wrongPath),
			`Error: ENOENT: no such file or directory, scandir '${wrongPath}'`
		);
	});

	it('generatePackage empty path', async () => {
		const emptyPath = join(basePath, 'empty');
		if (!existsSync(emptyPath)) {
			mkdirSync(emptyPath);
		}
		const descriptor = await generatePackage(emptyPath);
		deepStrictEqual(descriptor, {
			error: PackageError.Empty,
			files: [],
			jsons: [],
			runners: []
		});
	});

	it('generatePackage without jsons python', async () => {
		const jsonsPath = join(basePath, 'jsons', 'python');
		const descriptor = await generatePackage(jsonsPath);
		deepStrictEqual(descriptor, {
			error: PackageError.JsonNotFound,
			files: ['index.py', 'requirements.txt'],
			jsons: [],
			runners: ['python']
		});
	});

	it('generatePackage without jsons nodejs', async () => {
		const jsonsPath = join(basePath, 'jsons', 'nodejs');
		const descriptor = await generatePackage(jsonsPath);
		deepStrictEqual(descriptor, {
			error: PackageError.JsonNotFound,
			files: ['index.js', 'package.json'],
			jsons: [],
			runners: ['nodejs']
		});
	});

	it('generatePackage without runners python', async () => {
		const runnersPath = join(basePath, 'runners', 'python');
		const descriptor = await generatePackage(runnersPath);
		deepStrictEqual(descriptor, {
			error: PackageError.None,
			files: ['index.py', 'metacall.json'],
			jsons: ['metacall.json'],
			runners: []
		});
	});

	it('generatePackage without runners nodejs', async () => {
		const runnersPath = join(basePath, 'runners', 'nodejs');
		const descriptor = await generatePackage(runnersPath);
		deepStrictEqual(descriptor, {
			error: PackageError.None,
			files: ['index.js', 'metacall.json'],
			jsons: ['metacall.json'],
			runners: []
		});
	});

	it('generatePackage all python', async () => {
		const allPath = join(basePath, 'all', 'python');
		const descriptor = await generatePackage(allPath);
		deepStrictEqual(descriptor, {
			error: PackageError.None,
			files: ['index.py', 'metacall.json', 'requirements.txt'],
			jsons: ['metacall.json'],
			runners: ['python']
		});
	});

	it('generatePackage all nodejs', async () => {
		const allPath = join(basePath, 'all', 'nodejs');
		const descriptor = await generatePackage(allPath);
		deepStrictEqual(descriptor, {
			error: PackageError.None,
			files: ['index.js', 'metacall.json', 'package.json'],
			jsons: ['metacall.json'],
			runners: ['nodejs']
		});
	});
});
