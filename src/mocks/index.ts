/**
 * Mock implementations for testing
 * These are used when TEST_DEPLOY_LOCAL environment variable is set to 'true'
 */

export { default as mockLogin } from './login';
export { default as mockAPI } from './protocol';
export { default as mockSignup } from './signup';

/**
 * Returns true if mocks should be used instead of real implementations
 */
export function shouldUseMocks(): boolean {
	return process.env.TEST_DEPLOY_LOCAL === 'true';
}
