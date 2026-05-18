import API, { ProtocolError } from '@metacall/protocol/protocol';
import { fail, strictEqual } from 'assert';
import { checkEnvVars, clearCache } from './cli';

// Run this test only in production mode, not in local
const describeTest =
	process.env.TEST_DEPLOY_LOCAL !== 'true' ? describe : describe.skip;

describeTest('Unit Test Login', function () {
	this.timeout(180000);

	// Test for env variables before running tests
	before(async function () {
		await clearCache();
		checkEnvVars();
	});

	// Invalid token login
	it('Should fail with malformed jwt', async () => {
		await clearCache();

		const api = API('yeet', 'https://dashboard.metacall.io');

		try {
			await api.validate();

			fail(
				'The validation passed without errors and it should have failed.'
			);
		} catch (err) {
			const message = String((err as ProtocolError).data);
			strictEqual(message, 'jwt malformed');
		}
	});
});
