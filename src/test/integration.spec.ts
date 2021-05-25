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
	// This assumes that the user (token) has:
	//	1) Deploy Enabled
	//	2) One empty launchpad with Essential Plan
	const tokenP = startup();

	it('Should have a valid token', async () => {
		const token = await tokenP;
		ok(token !== '');
	});

	// Deploy Enabled
	it('Should have the deploy enabled', async () => {
		ok(await deployEnabled(await tokenP));
	});

	// Subscriptions
	it('Should have one Essential Plan', async () => {
		deepStrictEqual(await listSubscriptions(await tokenP), {
			Essential: 1
		});
	});

	// Inspect
	it('Should have no deployments yet', async () => {
		deepStrictEqual(await inspect(await tokenP), {});
	});

	// TODO: Implement deploy

	// TODO: Wait for deploy

	// TODO: Inspect with correct deployment data
	it('Should have the deployment set up', async () => {
		deepStrictEqual(await inspect(await tokenP), {
			/* TODO */
		});
	});

	// Delete Deploy (TODO: This wont pass until deploy is done)
	it('Should delete the deployment properly', async () => {
		const inspectData = await inspect(await tokenP);

		ok(inspectData.length > 0);

		const { prefix, suffix, version } = inspectData[0];
		const result = await deployDelete(
			await tokenP,
			prefix,
			suffix,
			version
		);

		ok(result === 'Deploy Delete Succeed');
	});
});
