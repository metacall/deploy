import { ok, strictEqual } from 'assert';
import { buildAlreadyExistsMessage } from '../deploy';

/**
 * Unit test for descriptive error message when deployment already exists (HTTP 400).
 * Tests that the error handler produces the correct user-facing message
 * with --force and --delete suggestions.
 *
 * References issue #218.
 */
describe('Deploy error handling', () => {
	it('buildAlreadyExistsMessage formats correctly', () => {
		const msg = buildAlreadyExistsMessage('test-app');
		strictEqual(
			msg,
			'Deployment "test-app" already exists. Use --force to redeploy or --delete to remove it.'
		);
		ok(msg.includes('--force'));
		ok(msg.includes('--delete'));
	});

	it('returns properly formatted string for empty input gracefully', () => {
		const msg = buildAlreadyExistsMessage('');
		ok(msg.includes('already exists'));
	});
});
