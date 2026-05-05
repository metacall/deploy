import type { API as APIInterface } from '@metacall/protocol/protocol';
import API from '@metacall/protocol/protocol';
import mockAPI from './protocol';

export { default as mockLogin } from './login';
export { default as mockSignup } from './signup';

/** * Returns true if mocks should be used instead of real implementations */ export function shouldUseMocks(): boolean {
	return process.env.TEST_DEPLOY_LOCAL === 'true';
}

/** * Returns the appropriate API instance (mock or real) based on the environment */ export function getAPI(
	token: string,
	baseURL: string
): APIInterface {
	return shouldUseMocks() ? mockAPI(token, baseURL) : API(token, baseURL);
}

// Re-export mockAPI for direct access
export { default as mockAPI } from './protocol';
