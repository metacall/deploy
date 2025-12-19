import { strictEqual } from 'assert';
import spawn from 'cross-spawn';
import { existsSync, mkdirSync, rmdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

describe('CLI Integration with --confDir', () => {
	// 1. Setup paths
	const customPath = join(process.cwd(), 'test-custom-config');
	const configFilePath = join(customPath, 'config.ini');

	// Path to the compiled CLI entry point
	const cliPath = resolve(__dirname, '../index.js');

	// 2. Mock Data
	const fakeToken = 'test-token-12345';
	const iniContent = `token=${fakeToken}`;

	before(() => {
		if (!existsSync(customPath)) {
			mkdirSync(customPath);
		}
		writeFileSync(configFilePath, iniContent, 'utf8');
	});

	after(() => {
		if (existsSync(customPath)) {
			rmdirSync(customPath, { recursive: true });
		}
	});

	it('should load config from a custom directory passed via --confDir', done => {
		const process = spawn('node', [cliPath, '--confDir', customPath], {
			stdio: 'pipe'
		});

		let output = '';

		// Fix: Explicitly type 'data' as Buffer so .toString() is safe
		process.stdout?.on('data', (data: Buffer) => {
			output += data.toString();
		});

		process.stderr?.on('data', (data: Buffer) => {
			output += data.toString();
		});

		// Fix: Removed unused 'code' parameter
		process.on('close', () => {
			const promptForLogin =
				output.includes('Select an option') || output.includes('Login');

			strictEqual(
				promptForLogin,
				false,
				'The CLI ignored the config file and prompted for login.'
			);

			done();
		});
	});
});
