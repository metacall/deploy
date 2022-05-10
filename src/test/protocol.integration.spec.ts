import { deepStrictEqual, ok, strictEqual } from 'assert';
import { createReadStream } from 'fs';
import { Plans } from 'metacall-protocol/plan';
import API from 'metacall-protocol/protocol';
import { basename, join } from 'path';
import { startup } from '../startup';
import args from './../cli/args';

describe('integration protocol', function () {
	this.timeout(200_000);

	let api: ReturnType<typeof API>;
	const url = 'https://github.com/metacall/examples';
	let selectedBranch: string;

	before(
		'Should have a valid token',
		async (): Promise<ReturnType<typeof API>> => {
			// This assumes that the user (token) has:
			//	1) Deploy Enabled
			//	2) One empty (and only one) launchpad with Essential Plan
			const { token, baseURL } = await startup(args['confDir']);
			ok(token);
			ok(baseURL === 'https://dashboard.metacall.io');
			api = API(token, baseURL);
			return api;
		}
	);

	// Deploy Enabled
	it('Should have the deploy enabled', async () => {
		const enabled = await api.deployEnabled();
		ok(enabled === true);
		return enabled;
	});

	// Subscriptions
	it('Should have one Essential Plan', async () => {
		const result = await api.listSubscriptions();
		deepStrictEqual(result, {
			Essential: 1
		});
		return result;
	});

	// Inspect
	it('Should have no deployments yet', async () => {
		const result = await api.inspect();
		deepStrictEqual(result, []);
		return result;
	});

	// Upload
	it('Should be able to upload', async () => {
		const filePath = join(
			process.cwd(),
			'src',
			'test',
			'resources',
			'integration',
			'protocol',
			'python-jose.zip'
		);
		const fileStream = createReadStream(filePath);
		const result = await api.upload(
			basename(filePath),
			fileStream,
			[],
			['python']
		);
		deepStrictEqual(result, { id: 'python-jose' });
		return result;
	});

	// Deploy
	it('Should be able to deploy', async () => {
		const result = await api.deploy(
			'python-jose',
			[],
			Plans.Essential,
			'Package'
		);

		deepStrictEqual(result, {
			prefix: 'josead',
			suffix: 'python-jose',
			version: 'v1'
		});
		return result;
	});

	// Wait for deploy
	it('Should have the deployment set up', async () => {
		const sleep = (ms: number): Promise<ReturnType<typeof setTimeout>> =>
			new Promise(resolve => setTimeout(resolve, ms));
		let result = false,
			wait = true;
		while (wait) {
			await sleep(1000);
			const inspect = await api.inspect();
			const deployIdx = inspect.findIndex(
				deploy => deploy.suffix === 'python-jose'
			);
			if (deployIdx !== -1) {
				switch (inspect[deployIdx].status) {
					case 'create':
						break;
					case 'ready':
						wait = false;
						result = true;
						break;
					default:
						wait = false;
						result = false;
						break;
				}
			}
		}
		strictEqual(result, true);
		return result;
	});

	// Delete Deploy
	it('Should delete the deployment properly', async () => {
		const inspect = await api.inspect();

		ok(inspect.length > 0);

		const deployIdx = inspect.findIndex(
			deploy => deploy.suffix === 'python-jose'
		);

		ok(deployIdx !== -1);

		const { prefix, suffix, version } = inspect[deployIdx];
		const result = await api.deployDelete(prefix, suffix, version);

		ok(result === 'Deploy Delete Succeed');
	});

	// List Repository Branches
	it('Should list all the repo branches', async () => {
		const { branches } = await api.branchList(url);
		selectedBranch = branches[0];

		ok(branches.length > 0);
	});

	it('Should list all the files', async () => {
		const result = await api.fileList(url, selectedBranch);

		ok(result.length > 0);
	});

	// Upload Repository
	it('Should be able upload the repository', async () => {
		const name = (await api.add(url, selectedBranch, [])).id;

		ok(name === 'metacall/examples');
	});

	// Deploy Repository
	it('Should be able to deploy the Repository', async () => {
		const result = await api.deploy(
			'metacall/examples',
			[],
			Plans.Essential,
			'Repository'
		);

		deepStrictEqual(result, {
			prefix: 'josead',
			suffix: 'metacall-examples',
			version: 'v1'
		});
		return result;
	});

	// Should have deployment setup
	// Wait for deploy
	it('Should have the deployment set up', async () => {
		const sleep = (ms: number): Promise<ReturnType<typeof setTimeout>> =>
			new Promise(resolve => setTimeout(resolve, ms));
		let result = false,
			wait = true;
		while (wait) {
			await sleep(1000);
			const inspect = await api.inspect();

			const deployIdx = inspect.findIndex(
				deploy => deploy.suffix === 'metacall-examples'
			);
			if (deployIdx !== -1) {
				switch (inspect[deployIdx].status) {
					case 'create':
						break;
					case 'ready':
						wait = false;
						result = true;
						break;
					default:
						wait = false;
						result = false;
						break;
				}
			}
		}
		strictEqual(result, true);
		return result;
	});

	// Delete Deploy
	it('Should delete the repository deployment properly', async () => {
		const inspect = await api.inspect();

		ok(inspect.length > 0);

		const deployIdx = inspect.findIndex(
			deploy => deploy.suffix === 'metacall-examples'
		);

		ok(deployIdx !== -1);

		const { prefix, suffix, version } = inspect[deployIdx];
		const result = await api.deployDelete(prefix, suffix, version);

		ok(result === 'Deploy Delete Succeed');
	});
});
