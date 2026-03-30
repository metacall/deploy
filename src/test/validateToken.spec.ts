import { strictEqual } from 'assert';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import { createRequire } from 'module';
import os from 'os';
import { join } from 'path';

const EXIT_ERROR = new Error('process.exit');
const localRequire = createRequire(__filename);

describe('validateToken', () => {
	const originalHome = process.env.HOME;
	const originalExit = process.exit.bind(process);
	const originalConsoleError = console.error;
	let tmpHome = '';
	let stderr = '';

	const loadModules = async () => {
		const configPath = localRequire.resolve('../config');
		const validateTokenPath = localRequire.resolve('../cli/validateToken');

		delete localRequire.cache[configPath];
		delete localRequire.cache[validateTokenPath];

		const config = await import('../config');
		const validateModule = await import('../cli/validateToken');
		const validateToken = validateModule.default;

		return { config, validateToken };
	};

	beforeEach(async () => {
		tmpHome = await fs.mkdtemp(join(os.tmpdir(), 'metacall-deploy-test-'));
		process.env.HOME = tmpHome;
		stderr = '';
		console.error = (...args: unknown[]) => {
			stderr += args.join(' ') + '\n';
		};
		process.exit = ((code?: number) => {
			throw Object.assign(EXIT_ERROR, { code });
		}) as typeof process.exit;
	});

	afterEach(async () => {
		process.env.HOME = originalHome;
		process.exit = originalExit;
		console.error = originalConsoleError;
		await fs.rm(tmpHome, { recursive: true, force: true });
	});

	it('preserves cached config on transient validation failures', async () => {
		const { config, validateToken } = await loadModules();
		await config.save({ token: 'cached-token' });

		const configPath = config.configFilePath();

		await validateToken({
			validate: () =>
				Promise.reject(
					new Error('getaddrinfo ENOTFOUND api.metacall.io')
				)
		} as never).catch(err => {
			strictEqual(err, EXIT_ERROR);
		});

		strictEqual(existsSync(configPath), true);
		strictEqual(
			(await config.load()).token,
			'cached-token',
			'expected token cache to remain intact'
		);
		strictEqual(stderr.includes('Cached credentials were preserved'), true);
	});

	it('clears cached config on authentication failures', async () => {
		const { config, validateToken } = await loadModules();
		await config.save({ token: 'cached-token' });

		const configPath = config.configFilePath();

		await validateToken({
			validate: () =>
				Promise.reject({
					response: {
						status: 401,
						data: 'jwt malformed'
					}
				})
		} as never).catch(err => {
			strictEqual(err, EXIT_ERROR);
		});

		strictEqual(existsSync(configPath), false);
		strictEqual(stderr.includes('Token validation failed'), true);
	});
});
