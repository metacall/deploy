import { fail, notStrictEqual, ok, strictEqual } from 'assert';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { load } from '../config';
import {
	checkEnvVars,
	clearCache,
	createTmpDirectory,
	deleted,
	deployed,
	keys,
	runCLI
} from './cli';

describe('Integration CLI (Deploy)', function () {
	this.timeout(2000000);

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

	// --confDir
	it('Should be able to login using --confDir flag', async function () {
		const file = await load();
		const token = file.token || '';

		notStrictEqual(token, '');

		await clearCache();

		const confDir = await createTmpDirectory();
		const configPath = join(confDir, 'config.ini');
		await writeFile(configPath, `token=${token}`, 'utf8');

		const workdir = await createTmpDirectory();

		try {
			await runCLI(
				[`--confDir=${confDir}`, `--workdir=${workdir}`],
				[keys.enter, keys.enter]
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
		const file = await load();
		const token = file.token || '';

		notStrictEqual(token, '');

		await clearCache();

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
			ok(String(err) === '! --yeet does not exist as a valid command.\n');
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

	// --inspect with invalid parameter
	it('Should fail --inspect command with proper output', async () => {
		try {
			const result = await runCLI(['--inspect', 'yeet'], [keys.enter])
				.promise;
			fail(
				`The CLI passed without errors and it should fail. Result: ${String(
					result
				)}`
			);
		} catch (error) {
			strictEqual(
				String(error),
				'X Invalid format passed to inspect, valid formats are: Table, Raw, OpenAPIv3\n'
			);
		}
	});

	// --inspect without parameter
	it('Should fail --inspect command with proper output', async () =>
		notStrictEqual(
			await runCLI(['--inspect'], [keys.enter]).promise,
			'X Invalid format passed to inspect, valid formats are: Table, Raw, OpenAPIv3\n'
		));

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

	// test .env file
	it('Should be able to deploy repository using --workdir & getting the .env file', async () => {
		const projectPath = join(
			process.cwd(),
			'src',
			'test',
			'resources',
			'integration',
			'env'
		);
		const result = await runCLI(
			[`--workdir=${projectPath}`],
			[keys.enter, keys.kill]
		).promise;

		ok(String(result).includes(`i Deploying ${projectPath}...\n`));

		strictEqual(await deployed('env'), true);
		return result;
	});

	// --delete
	it('Should be able to delete deployed repository using --delete flag', async () => {
		const result = await runCLI(['--delete'], [keys.enter, keys.enter])
			.promise;

		ok(String(result).includes('i Deploy Delete Succeed\n'));

		strictEqual(await deleted('env'), true);

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

	// TODO:
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
			'i Essential: 2\n'
		));
});

// TODO: Tests to add
// if there is only one log file -> select it (TODO: This must be reviewed in case we use TUI)
