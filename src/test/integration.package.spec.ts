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

	/* TODO:
	it('generatePackage without jsons', async () => {
		deepStrictEqual();
	});

	it('generatePackage without runners', async () => {
		deepStrictEqual();
	});

	it('generatePackage without all', async () => {
		deepStrictEqual();
	});
	*/
});
