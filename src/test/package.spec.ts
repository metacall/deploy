import { deepStrictEqual } from 'assert';
import { join } from 'path';
import { findFilesPath, findMetaCallJsons, findRunners } from '../lib/package';

describe('package', function () {
	it('findFilesPath', async () => {
		const basePath = join(process.cwd(), 'src', 'test', 'package');
		const expectedFiles: string[] = [
			'loaders/a/depth/folder/metacall.json',
			'loaders/csharp/metacall-cs.json',
			'loaders/gitignore/.gitignore',
			'loaders/gitignore/c',
			'loaders/metacall.json',
			'loaders/nodejs/metacall-node.json',
			'loaders/python/metacall-py.json',
			'loaders/ruby/metacall-rb.json',
			'runners/csharp/project.csproj',
			'runners/mixed/a.csproj',
			'runners/mixed/Gemfile',
			'runners/mixed/package.json',
			'runners/mixed/requirements.txt',
			'runners/nodejs/package.json',
			'runners/python/requirements.txt',
			'runners/ruby/Gemfile'
		];
		const files = await findFilesPath(basePath);
		deepStrictEqual(files, expectedFiles);
	});
	it('findMetaCallJsons', async () => {
		const basePath = join(
			process.cwd(),
			'src',
			'test',
			'package',
			'loaders'
		);
		const expectedFiles: string[] = [
			'a/depth/folder/metacall.json',
			'csharp/metacall-cs.json',
			'metacall.json',
			'nodejs/metacall-node.json',
			'python/metacall-py.json',
			'ruby/metacall-rb.json'
		];
		const files = await findFilesPath(basePath);
		deepStrictEqual(findMetaCallJsons(files), expectedFiles);
	});
	it('findRunners', async () => {
		const basePath = join(
			process.cwd(),
			'src',
			'test',
			'package',
			'runners'
		);
		const expectedFiles: string[] = [
			'csharp/project.csproj',
			'mixed/a.csproj',
			'mixed/Gemfile',
			'mixed/package.json',
			'mixed/requirements.txt',
			'nodejs/package.json',
			'python/requirements.txt',
			'ruby/Gemfile'
		];
		const expectedRunners: string[] = ['cs', 'rb', 'node', 'py'];
		const files = await findFilesPath(basePath);
		deepStrictEqual(files, expectedFiles);
		console.log('................................................');
		console.log(Array.from(findRunners(files)));
		console.log('................................................');
		deepStrictEqual(Array.from(findRunners(files)), expectedRunners);
	});
});
