import { fail, ok, strictEqual } from 'assert';
import { promises } from 'fs';
import os from 'os';
import { join } from 'path';
import { configFilePath } from '../config';
import { exists, loadFile } from '../utils';
import { deleted, deployed, keys, runWithInput } from './cmd';

const runCLI = (args: string[], inputs: string[]) => {
	return runWithInput('dist/index.js', args, inputs);
};

const clearCache = async (): Promise<void> => {
	if (await exists(configFilePath()))
		await runCLI(['-l'], [keys.enter]).promise;
};

const createTmpDirectory = async (): Promise<string> => {
	return await promises.mkdtemp(join(os.tmpdir(), `dep-`));
};

describe('integration cli', function () {
	this.timeout(200_0000);

	const url = 'https://github.com/metacall/examples';
	const addRepoSuffix = 'metacall-examples';

	const workDirSuffix = 'time-app-web';
	const filePath = join(
		process.cwd(),
		'src',
		'test',
		'resources',
		'integration',
		'time-app-web'
	);

	// Invalid Token Login
	it('Should fail with malformed jwt', async () => {
		await clearCache();

		const workdir = await createTmpDirectory();

		try {
			const result = await runCLI(
				['--token=yeet', `--workdir=${workdir}`],
				[keys.enter]
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

	// no credentials provided
	it('Should fail with no credentials with --tokem', async () => {
		await clearCache();

		try {
			const result = await runCLI(
				['--token='],
				[keys.enter, keys.enter, keys.kill]
			).promise;

			fail(
				`The CLI passed without errors and it should have failed. Result: ${String(
					result
				)}`
			);
		} catch (err) {
			ok(
				String(err) ===
					'! Token invalid: Invalid authorization header, no credentials provided.\n'
			);
		}
	});

	// Invalid login credentials
	it('Should fail with invalid login credentials', async () => {
		await clearCache();

		const workdir = await createTmpDirectory();

		try {
			const result = await runCLI(
				[
					'--email=yeet@yeet.com',
					'--password=yeetyeet',
					`--workdir=${workdir}`
				],
				[keys.enter]
			).promise;

			fail(
				`The CLI passed without errors and it should have failed. Result: ${String(
					result
				)}`
			);
		} catch (err) {
			ok(String(err) === '! : Invalid account email or password.\n');
		}
	});

	// --email & --password
	it('Should be able to login using --email & --password flag', async function () {
		await clearCache();

		const email = process.env.METACALL_AUTH_EMAIL;
		const password = process.env.METACALL_AUTH_PASSWORD;

		if (typeof email !== 'string' || typeof password !== 'string')
			return this.skip();

		const workdir = await createTmpDirectory();

		try {
			await runCLI(
				[
					`--email=${email}`,
					`--password=${password}`,
					`--workdir=${workdir}`
				],
				[keys.enter, keys.enter]
			).promise;
		} catch (err) {
			strictEqual(
				err,
				`X The directory you specified (${workdir}) is empty\n`
			);
		}
	});

	// --token
	it('Should be able to login using --token flag', async function () {
		const token = (await loadFile(configFilePath())).split('=')[1];

		await clearCache();

		if (typeof token !== 'string') return this.skip();

		const workdir = await createTmpDirectory();

		try {
			await runCLI(
				[`--token=${token}`, `--workdir=${workdir}`],
				[keys.enter, keys.enter]
			).promise;
		} catch (err) {
			strictEqual(
				err,
				`X The directory you specified (${workdir}) is empty\n`
			);
		}
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

		strictEqual(await deployed(addRepoSuffix), true);
		return result;
	});

	// --delete
	it('Should be able to delete deployed repository using --delete flag', async () => {
		const result = await runCLI(['--delete'], [keys.enter, keys.enter])
			.promise;

		ok(String(result).includes('i Deploy Delete Succeed\n'));

		strictEqual(await deleted(addRepoSuffix), true);

		return result;
	});

	// --workdir & --projectName
	it('Should be able to deploy repository using --workdir & --projectName flag', async () => {
		const result = await runCLI(
			[`--workdir=${filePath}`, `--projectName=${workDirSuffix}`],
			[keys.enter, keys.enter, keys.kill]
		).promise;

		ok(String(result).includes(`i Deploying ${filePath}...\n`));

		strictEqual(await deployed(workDirSuffix), true);
		return result;
	});

	// --delete
	it('Should be able to delete deployed repository using --delete flag', async () => {
		const result = await runCLI(['--delete'], [keys.enter, keys.enter])
			.promise;

		ok(String(result).includes('i Deploy Delete Succeed\n'));

		strictEqual(await deleted(workDirSuffix), true);

		return result;
	});

	// --workdir & --projectName & --plan
	it('Should be able to deploy repository using --workdir & --plan flag', async () => {
		const result = await runCLI(
			[
				`--workdir=${filePath}`,
				'--projectName=time-app-web',
				'--plan=Essential'
			],
			[keys.enter, keys.kill]
		).promise;

		ok(String(result).includes(`i Deploying ${filePath}...\n`));

		strictEqual(await deployed(workDirSuffix), true);

		return result;
	});

	// --force
	// it('Should be able to deploy forcefully using --force flag', async () => {
	// 	const resultDel = await runCLI(
	// 		[
	// 			`--workdir=${filePath}`,
	// 			`--projectName=${workDirSuffix}`,
	// 			'--plan=Essential',
	// 			'--force'
	// 		],
	// 		[keys.enter, keys.kill]
	// 	).promise;

	// 	ok(String(resultDel).includes('Trying to deploy forcefully!'));

	// 	strictEqual(await deleted(workDirSuffix), true);

	// 	const resultDeploy = await runCLI(
	// 		[
	// 			`--workdir=${filePath}`,
	// 			`--projectName=${workDirSuffix}`,
	// 			'--plan=Essential'
	// 		],
	// 		[keys.enter, keys.kill]
	// 	).promise;

	// 	ok(String(resultDeploy).includes(`i Deploying ${filePath}...\n`));

	// 	strictEqual(await deployed(workDirSuffix), true);

	// 	return resultDeploy;
	// });

	// --delete
	it('Should be able to delete deployed repository using --delete flag', async () => {
		const result = await runCLI(['--delete'], [keys.enter, keys.enter])
			.promise;

		ok(String(result).includes('i Deploy Delete Succeed\n'));

		strictEqual(await deleted(workDirSuffix), true);

		return result;
	});

	// --listPlans
	it("Should be able to list all the plans in user's account", async () =>
		strictEqual(
			await runCLI(['--listPlans'], [keys.enter]).promise,
			'i Essential : 1\n'
		));
});

// TODO: Tests to add
// if there is only one log file -> select it (TODO: This must be reviewed in case we use TUI)
