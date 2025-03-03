import { ok } from 'assert';
import path from 'path';
import { getEnv } from '../utils';

describe('Test a basic env project', () => {
	const previousCWD = process.cwd();

	const chdir = (...args: string[]): void => {
		process.chdir(path.resolve(previousCWD, ...args));
	};

	it('Run getEnv in env folder', async () => {
		chdir('src', 'test', 'resources', 'unit', 'env');
		const env = await getEnv();
		const result = env.find(
			element => element.name === 'TEST_VAR' && element.value === 'hello'
		);
		ok(result !== undefined);
	});

	after(function () {
		process.chdir(previousCWD);
	});
});
