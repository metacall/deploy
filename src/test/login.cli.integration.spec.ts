import { fail, ok } from 'assert';
import {
	checkEnvVars,
	clearCache,
	createTmpDirectory,
	generateRandomString,
	keys,
	runCLI
} from './cli';

// Run this test only in production mode, not in local
const describeTest =
	process.env.TEST_DEPLOY_LOCAL !== 'true' ? describe : describe.skip;

describeTest('Integration CLI (Login)', function () {
	this.timeout(2000000);

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

	// Note: Disable this test for now, I do not want to spam the FaaS
	// success signup
	/*
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
	*/
});

// TODO: Tests to add
// test for mangled token, expired
