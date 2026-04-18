import { deepStrictEqual, ok } from 'assert';
import { filterFiles, opt } from '../utils';

describe('Unit Utils Opt', () => {
	it('Should call a function with the provided string', () => {
		ok(opt(x => x, 'hello') === 'hello');
	});
	it('Should return empty string when second argument is null', () => {
		ok(opt(x => x, null) === '');
	});
});

describe('Unit Utils filterFiles', () => {
	it('Should correctly filter files based on ignore patterns', () => {
		const files = [
			'src/index.js',
			'node_modules/express/index.js',
			'package.json',
			'test.log',
			'foo/bar/test.log'
		];

		const ignorePatterns = ['node_modules', '*.log'];
		const filtered = filterFiles(files, ignorePatterns);

		deepStrictEqual(filtered, ['src/index.js', 'package.json']);
	});
});
