import { ok } from 'assert';
import path from 'path';
import { getEnv } from '../utils';

describe('Test a basic env project', () => {
	const previousCWD = process.cwd();

	const chdir = (...args: string[]): string => {
		const dir = path.resolve(previousCWD, ...args);
		process.chdir(dir);
		return dir;
	};

	it('Run getEnv in env folder', async () => {
		const env = await getEnv(
			chdir('src', 'test', 'resources', 'unit', 'env')
		);
		const result = env.find(
			element => element.name === 'TEST_VAR' && element.value === 'hello'
		);
		ok(result !== undefined);
	});

	after(function () {
		process.chdir(previousCWD);
	});
});
