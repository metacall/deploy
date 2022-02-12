import { fail, ok } from 'assert';
import { keys, runWithInput } from './cmd';

const runCLI = (args: string[], inputs: string[]) => {
	return runWithInput('dist/index.js', args, inputs);
};

describe('integration cli', function () {
	this.timeout(200_000);

	// Invalid Token Login
	it('Should fail with malformed jwt', async () => {
		try {
			const result = await runCLI(
				[],
				[keys.enter, 'yeet', keys.enter, keys.kill]
			).promise;

			fail(
				`The CLI passed without errors and it should have failed. Result: ${String(
					result
				)}`
			);
		} catch (err) {
			ok(String(err) === '! Token invalid: jwt malformed\n');
		}
	});
});
