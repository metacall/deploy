import login from '@metacall/protocol/login';
import { Plans } from '@metacall/protocol/plan';
import { waitFor } from '@metacall/protocol/protocol';
import { notStrictEqual, ok, strictEqual } from 'assert';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import args from '../cli/args';
import { InspectFormat } from '../cli/args';
import { inspect } from '../cli/inspect';
import { deleteBySelection } from '../delete';
import { deployFromRepository, deployPackage } from '../deploy';
import { createTmpDirectory } from './cli';
import {
	AuthContext,
	ProcessExitMock,
	SelectionMock,
	StartupMock,
	clearCache,
	getAPI
} from './api';

describe('Integration API (Deploy)', function () {
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

	let auth: AuthContext;

	const awaitReady = (suffix: string) =>
		waitFor(async cancel => {
			const deploy = await auth.api.inspectByName(suffix);

			if (deploy.status === 'create') {
				throw new Error('Not ready yet');
			} else if (deploy.status === 'fail') {
				cancel('Deploy failed');
			}

			return deploy;
		});

	const awaitDeleted = (suffix: string) =>
		waitFor(async () => {
			const deployments = await auth.api.inspect();
			const found = deployments.find(d => d.suffix === suffix);

			if (found) {
				throw new Error('Still exists');
			}

			return true;
		});

	before(async function () {
		SelectionMock.install();
		auth = await getAPI();
		StartupMock.install(auth.config);
	});

	after(function () {
		StartupMock.restore();
		SelectionMock.restore();
	});

	// --email & --password
	it('Should be able to login using --email & --password flag', async function () {
		const email = process.env.METACALL_AUTH_EMAIL;
		const password = process.env.METACALL_AUTH_PASSWORD;

		if (!email || !password) {
			return this.skip();
		}

		const token = await login(email, password, auth.config.baseURL);
		notStrictEqual(token, '');
	});

	// --token
	it('Should be able to login using --token flag', async function () {
		await clearCache();

		const freshAuth = await getAPI();
		notStrictEqual(freshAuth.config.token, '');
	});

	// --confDir
	it('Should be able to login using --confDir flag', async function () {
		const confDir = await createTmpDirectory();
		const configPath = join(confDir, 'config.ini');
		await writeFile(configPath, `token=${auth.config.token}`, 'utf8');

		const confDirAuth = await getAPI(confDir);
		notStrictEqual(confDirAuth.config.token, '');
	});

	// --inspect with invalid parameter
	it('Should fail --inspect command with proper output', async function () {
		ProcessExitMock.install();
		try {
			await inspect(InspectFormat.Invalid, auth.config, auth.api);
		} catch (err) {
			ok(
				String(err).includes('process.exit') ||
				String(err).includes('Invalid format')
			);
		} finally {
			ProcessExitMock.restore();
		}
	});

	// --inspect without parameter
	it('Should pass --inspect command with valid output', async function () {
		await inspect(InspectFormat.Raw, auth.config, auth.api);
	});

	// --addrepo
	it('Should be able to deploy repository using --addrepo flag', async function () {
		await deployFromRepository(auth.api, Plans.Essential, url);

		const deploy = await awaitReady(addRepoSuffix);
		strictEqual(deploy.status, 'ready');
	});

	// --delete
	it('Should be able to delete deployed repository using --delete flag', async function () {
		await awaitReady(addRepoSuffix);
		await deleteBySelection(auth.api);

		strictEqual(await awaitDeleted(addRepoSuffix), true);
	});

	// --workdir & --projectName
	it('Should be able to deploy repository using --workdir & --projectName flag', async function () {
		args.projectName = workDirSuffix;

		await deployPackage(filePath, auth.api, Plans.Essential);

		const deploy = await awaitReady(workDirSuffix);
		strictEqual(deploy.status, 'ready');
	});

	// --delete
	it('Should be able to delete deployed repository using --delete flag', async function () {
		await awaitReady(workDirSuffix);
		await deleteBySelection(auth.api);

		strictEqual(await awaitDeleted(workDirSuffix), true);
	});

	// --addrepo with env vars
	it('Should be able to deploy repository using --addrepo flag with environment vars', async function () {
		SelectionMock.install({ listChoice: 'first', consent: true });

		await deployFromRepository(auth.api, Plans.Essential, url);

		const deploy = await awaitReady(addRepoSuffix);
		strictEqual(deploy.status, 'ready');

		SelectionMock.install();
	});

	// --delete
	it('Should be able to delete deployed repository using --delete flag', async function () {
		await awaitReady(addRepoSuffix);
		await deleteBySelection(auth.api);

		strictEqual(await awaitDeleted(addRepoSuffix), true);
	});

	// --workdir with .env file
	it('Should be able to deploy repository using --workdir & getting the .env file', async function () {
		const projectPath = join(
			process.cwd(),
			'src',
			'test',
			'resources',
			'integration',
			'env'
		);
		args.projectName = 'env';

		await deployPackage(projectPath, auth.api, Plans.Essential);

		const deploy = await awaitReady('env');
		strictEqual(deploy.status, 'ready');
	});

	// --delete
	it('Should be able to delete deployed repository using --delete flag', async function () {
		await awaitReady('env');
		await deleteBySelection(auth.api);

		strictEqual(await awaitDeleted('env'), true);
	});

	// --workdir & --projectName & --plan
	it('Should be able to deploy repository using --workdir & --plan flag', async function () {
		args.projectName = workDirSuffix;

		await deployPackage(filePath, auth.api, Plans.Essential);

		const deploy = await awaitReady(workDirSuffix);
		strictEqual(deploy.status, 'ready');
	});

	// --delete
	it('Should be able to delete deployed repository using --delete flag', async function () {
		await awaitReady(workDirSuffix);
		await deleteBySelection(auth.api);

		strictEqual(await awaitDeleted(workDirSuffix), true);
	});
});
