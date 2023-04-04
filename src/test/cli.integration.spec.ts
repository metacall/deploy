import { fail, notStrictEqual, ok, strictEqual } from 'assert';
import * as dotenv from 'dotenv';
import { promises } from 'fs';
import os from 'os';
import { join } from 'path';
import { configFilePath } from '../config';
import { exists, loadFile } from '../utils';
import {
	deleted,
	deployed,
	generateRandomString,
	keys,
	runWithInput
} from './cmd';

dotenv.config();

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

describe('Integration CLI', function () {
	this.timeout(2000000);

	const url = 'https://github.com/metacall/examples';
	const addRepoSuffix = 'metacall-examples';
	const inspectFormats = ['Table', 'Raw', 'OpenAPIv3'];

	const workDirSuffix = 'time-app-web';
	const filePath = join(
		process.cwd(),
		'src',
		'test',
		'resources',
		'integration',
		'time-app-web'
	);

	const checkEnvVars = (): { email: string; password: string } | never => {
		const email = process.env.METACALL_AUTH_EMAIL;
		const password = process.env.METACALL_AUTH_PASSWORD;

		if (typeof email === 'undefined' || typeof password === 'undefined') {
			fail(
				'No environment files present to test the below flags, please set up METACALL_AUTH_EMAIL and METACALL_AUTH_PASSWORD'
			);
		}

		return { email, password };
	};

	// Test for env variables before running tests
	before(async function () {
		await clearCache();
		checkEnvVars();
	});

	// Invalid token login
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
			ok(String(err) === 'X Token invalid: jwt malformed\n');
		}
	});

	// No credentials provided
	it('Should fail with no credentials with --token', async () => {
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
					'X Token invalid: Invalid authorization header, no credentials provided.\n'
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
			ok(String(err) === 'X Invalid account email or password.\n');
		}
	});

	// --email & --password
	it('Should be able to login using --email & --password flag', async function () {
		await clearCache();
		const { email, password } = checkEnvVars();
		const workdir = await createTmpDirectory();

		try {
			await runCLI(
				[
					`--email=${email}`,
					`--password=${password}`,
					`--workdir=${workdir}`
				],
				[keys.enter]
			).promise;
		} catch (err) {
			strictEqual(
				err,
				`X The directory you specified (${workdir}) is empty.\n`
			);
		}
	});

	// --token
	it('Should be able to login using --token flag', async function () {
		const file = await loadFile(configFilePath());
		const token = file.split('=')[1];

		await clearCache();

		notStrictEqual(token, undefined);

		const workdir = await createTmpDirectory();

		try {
			await runCLI(
				[`--token=${token}`, `--workdir=${workdir}`],
				[keys.enter, keys.enter]
			).promise;
		} catch (err) {
			strictEqual(
				err,
				`X The directory you specified (${workdir}) is empty.\n`
			);
		}
	});

	// checking if there is no deployments throw inspect
	it(`Should fail with inspect if there is no active deployments`, async function () {
		for (const format of inspectFormats) {
			try {
				await runCLI([`--inspect ${format}}`], [keys.enter]).promise;
				fail(
					`It gives active deployments in ${format} format while there is none`
				);
			} catch (error) {
				continue;
			}
		}
		ok(`Passes in the 3 inspect formats when there is no deployments`);
	});

	// --help
	it('Should be able to print help guide using --help flag', async () => {
		const result = await runCLI(['--help'], [keys.enter]).promise;

		ok(String(result).includes('Official CLI for metacall-deploy\n'));
	});

	// --unknown-flags
	it('Should be able to handle unknown flag', async () => {
		try {
			const result = await runCLI(['--yeet'], [keys.enter]).promise;

			fail(
				`The CLI passed without errors and it should have failed. Result: ${String(
					result
				)}`
			);
		} catch (err) {
			ok(
				String(err) === '! --yeet does not exists as a valid command.\n'
			);
		}
	});

	// --addrepo
	it('Should be able to deploy repository using --addrepo flag', async () => {
		const result = await runCLI(
			[`--addrepo=${url}`],
			[keys.enter, 'n', keys.enter, keys.kill]
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
			[keys.enter, 'n', keys.enter, keys.kill]
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

	// with env vars
	it('Should be able to deploy repository using --addrepo flag with environment vars', async () => {
		const result = await runCLI(
			[`--addrepo=${url}`],
			[
				keys.enter,
				'y',
				keys.enter,
				'PORT=1000, ENV=PROD',
				keys.enter,
				keys.kill
			]
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
			[keys.enter, 'n', keys.enter, keys.kill]
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

	// 	strictEqual(
	// 		await runCLI(['--listPlans'], [keys.enter]).promise,
	// 		'i Essential: 1\n'
	// 	);

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
			'i Essential: 1\n'
		));

	// signup already taken email
	it('Should fail with taken email', async () => {
		await clearCache();
		try {
			const result = await runCLI(
				[],
				[
					keys.down,
					keys.down,
					keys.enter,
					'noot@noot.com',
					keys.enter,
					'diaa',
					keys.enter,
					'diaa',
					keys.enter,
					'diaa',
					keys.enter
				]
			).promise;
			fail(
				`The CLI passed without errors and it should fail. Result: ${String(
					result
				)}`
			);
		} catch (error) {
			ok(String(error).includes('Account already exists'));
		}
	});

	// signup with invalid email
	it('Should fail with invalid email', async () => {
		await clearCache();

		try {
			const result = await runCLI(
				[],
				[
					keys.up,
					keys.enter,
					'diaabadr82gmail.com',
					keys.enter,
					'1234',
					keys.enter,
					'1234',
					keys.enter,
					'diaa',
					keys.enter
				]
			).promise;
			fail(
				`The CLI passed without errors and it should fail. Result: ${String(
					result
				)}`
			);
		} catch (error) {
			ok(String(error).includes('Invalid email'));
		}
	});

	// signup with taken alias
	it('Should fail with taken alias', async () => {
		await clearCache();
		const str = generateRandomString(Math.floor(Math.random() * 10) + 1);

		try {
			const result = await runCLI(
				[],
				[
					keys.up,
					keys.enter,
					`${str}@yeet.com`,
					keys.enter,
					'1234',
					keys.enter,
					'1234',
					keys.enter,
					'creatoon',
					keys.enter
				]
			).promise;
			fail(
				`The CLI passed without errors and it should fail. Result: ${String(
					result
				)}`
			);
		} catch (error) {
			ok(String(error).includes('alias is already taken'));
		}
	});

	// success signup
	it('Should be able to signup successfully', async () => {
		await clearCache();
		const str = generateRandomString(Math.floor(Math.random() * 10) + 1);

		try {
			const result = await runCLI(
				[],
				[
					keys.up,
					keys.enter,
					`${str}@yeet.com`,
					keys.enter,
					str,
					keys.enter,
					str,
					keys.enter,
					str,
					keys.enter
				]
			).promise;
			ok(String(result).includes('A verification email has been sent'));
		} catch (error) {
			fail(
				`The CLI failed with error: ${String(
					error
				)} and it should pass.`
			);
		}
	});
});

// TODO: Tests to add
// if there is only one log file -> select it (TODO: This must be reviewed in case we use TUI)

// test for mangled token, expired
