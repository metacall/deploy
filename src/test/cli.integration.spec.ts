import { fail, ok, strictEqual } from 'assert';
import { join } from 'path';
import { deployed, keys, runWithInput } from './cmd';

const runCLI = (args: string[], inputs: string[]) => {
	return runWithInput('dist/index.js', args, inputs);
};

describe('integration cli', function () {
	this.timeout(200_000);

	const url = 'https://github.com/metacall/examples';

	// Invalid Token Login
	it('Should fail with malformed jwt', async () => {
		try {
			const result = await runCLI(
				[],
				[keys.enter, 'yeet', keys.enter, keys.kill]
			).promise;

			fail(
				`The CLI passed without errors and it should have failed. Result: ${String(
					result
				)}`
			);
		} catch (err) {
			ok(String(err) === '! Token invalid: jwt malformed\n');
		}
	});

	// --email & --password
	it('Should be able to login using --email & --password flag', async function () {
		const email = process.env.EMAIL;
		const password = process.env.PASSWORD;

		if (typeof email !== 'string' || typeof password !== 'string')
			return this.skip();

		const result = await runCLI(
			[`--email=${email}`, `--password=${password}`],
			[keys.enter, keys.enter, keys.down, keys.enter, keys.kill]
		).promise;

		ok(String(result).includes('i Login Successfull!\n'));

		return result;
	});

	// --token
	it('Should be able to login using --token flag', async function () {
		const token = process.env.TOKEN;

		if (typeof token !== 'string') return this.skip();

		const result = await runCLI(
			[`--token=${token}`],
			[keys.enter, keys.enter, keys.enter, keys.kill]
		).promise;

		ok(String(result).includes('i Login Successfull!\n'));

		return result;
	});

	// --help
	it('Should be able to print help guide using --help flag', async () => {
		const result = await runCLI(['--help'], [keys.enter]).promise;

		ok(String(result).includes('Official CLI for metacall-deploy\n'));
	});

	// --addrepo
	it('Should be able to deploy repository using --addrepo flag', async () => {
		const result = await runCLI(
			[`--addrepo=${url}`],
			[keys.enter, keys.enter, keys.enter]
		).promise;

		ok(String(result).includes('i Deploying...\n'));

		strictEqual(await deployed('metacall-examples'), true);
		return result;
	});

	// --delete
	it('Should be able to delete deployed repository using --delete flag', async () => {
		const result = await runCLI(['--delete'], [keys.enter, keys.enter])
			.promise;

		ok(String(result).includes('i Deploy Delete Succeed\n'));
	});

	// --workdir & --projectName
	it('Should be able to deploy repository using --workdir & --projectName flag', async () => {
		const filePath = join(
			process.cwd(),
			'src',
			'test',
			'resources',
			'integration',
			'time-app-web'
		);

		const result = await runCLI(
			[`--workdir=${filePath}`, '--projectName=time-app-web'],
			[keys.enter, keys.enter, keys.kill]
		).promise;

		ok(String(result).includes(`i Deploying ${filePath}...\n`));

		strictEqual(await deployed('time-app-web'), true);
		return result;
	});

	it('Should be able to delete deployed directory using --delete flag', async () => {
		const result = await runCLI(['--delete'], [keys.enter, keys.enter])
			.promise;

		ok(String(result).includes('i Deploy Delete Succeed\n'));
	});

	// --workdir & --projectName & --plan
	it('Should be able to deploy repository using --workdir & --plan flag', async () => {
		const filePath = join(
			process.cwd(),
			'src',
			'test',
			'resources',
			'integration',
			'time-app-web'
		);

		const result = await runCLI(
			[
				`--workdir=${filePath}`,
				'--projectName=time-app-web',
				'--plan=Essential'
			],
			[keys.enter, keys.kill]
		).promise;

		ok(String(result).includes(`i Deploying ${filePath}...\n`));

		strictEqual(await deployed('time-app-web'), true);

		return result;
	});

	// --delete
	it('Should be able to delete deployed directory using --delete flag', async () => {
		const result = await runCLI(['--delete'], [keys.enter, keys.enter])
			.promise;

		ok(String(result).includes('i Deploy Delete Succeed\n'));
	});
});
