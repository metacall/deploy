import { strictEqual } from 'assert';
import { existsSync, mkdirSync, rmdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { startup } from '../startup';

describe('Configuration Directory Logic', () => {
	// 1. Create a temporary folder path
	const customPath = join(process.cwd(), 'test-custom-config');
	const configFilePath = join(customPath, 'config.ini');

	const fakeToken = 'test-token-12345';

	// Write in INI format (key=value)
	const iniContent = `token=${fakeToken}`;

	before(() => {
		if (!existsSync(customPath)) {
			mkdirSync(customPath);
		}
		// Write the INI file
		writeFileSync(configFilePath, iniContent, 'utf8');
	});

	after(() => {
		if (existsSync(customPath)) {
			// Cleanup
			rmdirSync(customPath, { recursive: true });
		}
	});

	it('should load config from a custom directory via --confDir', async () => {
		// Run startup. It should find config.ini and use the token inside.
		const config = await startup(customPath);

		strictEqual(
			config.token,
			fakeToken,
			'The token loaded does not match the custom config file'
		);
	});
});
