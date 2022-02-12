import { deepStrictEqual, ok, strictEqual } from 'assert';
import { createReadStream } from 'fs';
import API from 'metacall-protocol/protocol';
import { basename, join } from 'path';
import { startup } from '../startup';

describe('integration protocol', function () {
	this.timeout(200_000);

	let api: ReturnType<typeof API>;

	before(
		'Should have a valid token',
		async (): Promise<ReturnType<typeof API>> => {
			// This assumes that the user (token) has:
			//	1) Deploy Enabled
			//	2) One empty (and only one) launchpad with Essential Plan
			const { token, baseURL } = await startup();
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
		const result = await api.deploy('python-jose', [], 'Essential');
		strictEqual(result, '');
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
});
