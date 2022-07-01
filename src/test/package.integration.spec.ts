import { generatePackage } from '@metacall/protocol/package';
import { deepStrictEqual } from 'assert';
import { join } from 'path';
import { zip } from '../utils';

describe('integration package', function () {
	// Folder hierarchy bug
	it('Should generate a zip respecting the folder hierarchy instead of flattening it', async () => {
		const rootPath = join(
			process.cwd(),
			'src',
			'test',
			'resources',
			'integration',
			'folder-hierarchy'
		);

		const descriptor = await generatePackage(rootPath);

		const files = ['metacall-py.json', 'README.md', 'src/index.py'];

		deepStrictEqual(descriptor, {
			error: 'Package correctly generated',
			files,
			jsons: ['metacall-py.json'],
			runners: []
		});

		const archiveFiles: string[] = [];

		await zip(rootPath, descriptor.files, undefined, name =>
			archiveFiles.push(name)
		);

		deepStrictEqual(files, archiveFiles);
	});
});
