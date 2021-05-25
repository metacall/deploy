import { deepStrictEqual, ok } from 'assert';
import {
	deployDelete,
	deployEnabled,
	inspect,
	listSubscriptions
} from '../protocol/api';
import { startup } from '../startup';

describe('integration', function () {
	this.timeout(30_000);

	let token: string;

	before('Should have a valid token', async () => {
		// This assumes that the user (token) has:
		//	1) Deploy Enabled
		//	2) One empty launchpad with Essential Plan
		token = await startup();
		ok(token !== '');
		return token;
	});

	// Deploy Enabled
	it('Should have the deploy enabled', async () => {
		ok(await deployEnabled(token));
	});

	// Subscriptions
	it('Should have one Essential Plan', async () => {
		deepStrictEqual(await listSubscriptions(token), {
			Essential: 1
		});
	});

	// Inspect
	it('Should have no deployments yet', async () => {
		deepStrictEqual(await inspect(token), []);
	});

	// TODO: Implement deploy

	// TODO: Wait for deploy

	// TODO: Inspect with correct deployment data
	it('Should have the deployment set up', async () => {
		deepStrictEqual(await inspect(token), [
			/* TODO */
		]);
	});

	// Delete Deploy (TODO: This wont pass until deploy is done)
	it('Should delete the deployment properly', async () => {
		const inspectData = await inspect(token);

		ok(inspectData.length > 0);

		const { prefix, suffix, version } = inspectData[0];
		const result = await deployDelete(token, prefix, suffix, version);

		ok(result === 'Deploy Delete Succeed');
	});
});
