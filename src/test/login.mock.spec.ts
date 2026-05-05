import { fail, strictEqual } from 'assert';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { clearCache, createTmpDirectory, keys, runCLI } from './cli';

// Run this test only in local mode with mocks
const describeTest =
	process.env.TEST_DEPLOY_LOCAL === 'true' ? describe : describe.skip;

describeTest('Integration CLI (Login with Mocks)', function () {
	this.timeout(2000000);

	// --email & --password with mocks
	it('Should be able to login using --email & --password flag with mocks', async function () {
		await clearCache();
		const workdir = await createTmpDirectory();

		try {
			await runCLI(
				[
					'--email=test@example.com',
					'--password=testpass',
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

	// --token with mocks
	it('Should be able to login using --token flag with mocks', async function () {
		await clearCache();

		const workdir = await createTmpDirectory();

		try {
			await runCLI(
				[`--token=mock_token_test@example.com`, `--workdir=${workdir}`],
				[keys.enter, keys.enter]
			).promise;
		} catch (err) {
			strictEqual(
				err,
				`X The directory you specified (${workdir}) is empty.\n`
			);
		}
	});

	// --confDir with mocks
	it('Should be able to login using --confDir flag with mocks', async function () {
		await clearCache();

		const confDir = await createTmpDirectory();
		const configPath = join(confDir, 'config.ini');
		await writeFile(
			configPath,
			'token=mock_token_test@example.com',
			'utf8'
		);

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

	// Invalid email/password with mocks
	it('Should fail with invalid email/password with mocks', async () => {
		await clearCache();

		try {
			const result = await runCLI(
				['--email=yeet@yeet.com', '--password=yeetyeet'],
				[keys.enter]
			).promise;

			fail(
				`The CLI passed without errors and it should have failed. Result: ${String(
					result
				)}`
			);
		} catch (err) {
			strictEqual(err, 'X Invalid account email or password.\n');
		}
	});

	// Empty credentials with mocks
	it('Should fail with empty credentials with mocks', async () => {
		await clearCache();

		try {
			const result = await runCLI(['--token='], [keys.enter]).promise;

			fail(
				`The CLI passed without errors and it should have failed. Result: ${String(
					result
				)}`
			);
		} catch (err) {
			strictEqual(
				err,
				'X Invalid authorization header, no credentials provided.\n'
			);
		}
	});

	// Invalid email format with mocks
	it('Should fail with invalid email format with mocks', async () => {
		await clearCache();

		try {
			const result = await runCLI(
				['--email=invalidemail', '--password=testpass'],
				[keys.enter]
			).promise;

			fail(
				`The CLI passed without errors and it should have failed. Result: ${String(
					result
				)}`
			);
		} catch (err) {
			strictEqual(err, 'X Invalid email\n');
		}
	});
});
