import { deepStrictEqual } from 'assert';
import { join } from 'path';
import { findFilesPath, findMetaCallJsons, findRunners } from '../lib/package';

describe('unit package', function () {
	const basePath = join(process.cwd(), 'src', 'test', 'resources', 'package');

	it('findFilesPath all', async () => {
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
			'runners/nodejs/index.js',
			'runners/nodejs/package.json',
			'runners/python/requirements.txt',
			'runners/ruby/Gemfile'
		];
		const files = await findFilesPath(basePath);
		deepStrictEqual(files, expectedFiles);
	});

	it('findMetaCallJsons all', async () => {
		const loadersPath = join(basePath, 'loaders');
		const expectedFiles: string[] = [
			'a/depth/folder/metacall.json',
			'csharp/metacall-cs.json',
			'metacall.json',
			'nodejs/metacall-node.json',
			'python/metacall-py.json',
			'ruby/metacall-rb.json'
		];
		const files = await findFilesPath(loadersPath);
		deepStrictEqual(findMetaCallJsons(files), expectedFiles);
	});

	it('findMetaCallJsons empty', async () => {
		const runnersPath = join(basePath, 'runners');
		const expectedFiles: string[] = [];
		const files = await findFilesPath(runnersPath);
		deepStrictEqual(findMetaCallJsons(files), expectedFiles);
	});

	it('findRunners all', async () => {
		const runnersPath = join(basePath, 'runners');
		const expectedFiles: string[] = [
			'csharp/project.csproj',
			'mixed/a.csproj',
			'mixed/Gemfile',
			'mixed/package.json',
			'mixed/requirements.txt',
			'nodejs/index.js',
			'nodejs/package.json',
			'python/requirements.txt',
			'ruby/Gemfile'
		];
		const expectedRunners: string[] = [
			'csharp',
			'ruby',
			'nodejs',
			'python'
		];
		const files = await findFilesPath(runnersPath);
		deepStrictEqual(files, expectedFiles);
		deepStrictEqual(Array.from(findRunners(files)), expectedRunners);
	});

	it('findRunners empty', async () => {
		const loadersPath = join(basePath, 'loaders');
		const expectedRunners: string[] = [];
		const files = await findFilesPath(loadersPath);
		deepStrictEqual(Array.from(findRunners(files)), expectedRunners);
	});

	it('findRunners mixed', async () => {
		const runnersMixedPath = join(basePath, 'runners', 'mixed');
		const expectedRunners: string[] = [
			'csharp',
			'ruby',
			'nodejs',
			'python'
		];
		const files = await findFilesPath(runnersMixedPath);
		deepStrictEqual(Array.from(findRunners(files)), expectedRunners);
	});

	it('findRunners csharp', async () => {
		const runnersPath = join(basePath, 'runners', 'csharp');
		const expectedRunners: string[] = ['csharp'];
		const files = await findFilesPath(runnersPath);
		deepStrictEqual(Array.from(findRunners(files)), expectedRunners);
	});

	it('findRunners nodejs', async () => {
		const runnersPath = join(basePath, 'runners', 'nodejs');
		const expectedRunners: string[] = ['nodejs'];
		const files = await findFilesPath(runnersPath);
		deepStrictEqual(Array.from(findRunners(files)), expectedRunners);
	});

	it('findRunners python', async () => {
		const runnersPath = join(basePath, 'runners', 'python');
		const expectedRunners: string[] = ['python'];
		const files = await findFilesPath(runnersPath);
		deepStrictEqual(Array.from(findRunners(files)), expectedRunners);
	});

	it('findRunners ruby', async () => {
		const runnersPath = join(basePath, 'runners', 'ruby');
		const expectedRunners: string[] = ['ruby'];
		const files = await findFilesPath(runnersPath);
		deepStrictEqual(Array.from(findRunners(files)), expectedRunners);
	});
});
