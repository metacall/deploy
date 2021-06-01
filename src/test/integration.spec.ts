import { deepStrictEqual, ok } from 'assert';
import API from '../lib/protocol';
import { startup } from '../startup';

describe('integration', function () {
	this.timeout(30_000);

	let api: ReturnType<typeof API>;

	before('Should have a valid token', async (): Promise<
		ReturnType<typeof API>
	> => {
		// This assumes that the user (token) has:
		//	1) Deploy Enabled
		//	2) One empty launchpad with Essential Plan
		const { token, baseURL } = await startup();
		ok(token);
		ok(baseURL === 'https://dashboard.metacall.io');
		api = API(token, baseURL);
		return api;
	});

	// Deploy Enabled
	it('Should have the deploy enabled', async () => {
		ok(await api.deployEnabled());
	});

	// Subscriptions
	it('Should have one Essential Plan', async () => {
		deepStrictEqual(await api.listSubscriptions(), {
			Essential: 1
		});
	});

	// Inspect
	it('Should have no deployments yet', async () => {
		deepStrictEqual(await api.inspect(), []);
	});

	// TODO: Implement deploy

	// TODO: Wait for deploy

	// TODO: Inspect with correct deployment data
	it('Should have the deployment set up', async () => {
		deepStrictEqual(await api.inspect(), [
			/* TODO */
		]);
	});

	// Delete Deploy (TODO: This wont pass until deploy is done)
	it('Should delete the deployment properly', async () => {
		const inspectData = await api.inspect();

		ok(inspectData.length > 0);

		const { prefix, suffix, version } = inspectData[0];
		const result = await api.deployDelete(prefix, suffix, version);

		ok(result === 'Deploy Delete Succeed');
	});
});
