import { ok, deepEqual } from 'assert';
import { startup } from '../startup';
import {
	deployEnabled,
	listSubscriptions,
	inspect,
	deployDelete
} from '../protocol/api';

describe('integration', () => {
	// This assumes that the user (token) has:
	//	1) Deploy Enabled
	//	2) One empty launchpad with Essential Plan
	let token: string;

	it('Should have a valid token', async () => {
		token = await startup();
		ok(token !== '');
	});

	// Deploy Enabled
	it('Should have the deploy enabled', async () => {
		ok(await deployEnabled(token) === true);
	});

	// Subscriptions
	it('Should have one Essential Plan', async () => {
		deepEqual(await listSubscriptions(token), { Essential: 1 });
	});

	// Inspect
	it('Should have no deployments yet', async () => {
		deepEqual(await inspect(token), {});
	});

	// TODO: Implement deploy

	// TODO: Wait for deploy

	// TODO: Inspect with correct deployment data
	it('Should have the deployment set up', async () => {
		deepEqual(await inspect(token), { /* TODO */});
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
