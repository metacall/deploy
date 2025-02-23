import { ok, deepStrictEqual, strictEqual } from 'assert';
import { opt } from '../utils';
import { stub, restore, SinonStub } from 'sinon';
import fs from 'fs/promises';
import proxyquire from 'proxyquire';

describe('Unit Utils Opt', () => {
	it('Should call a function with the provided string', () => {
		ok(opt(x => x, 'hello') === 'hello');
	});
	it('Should return empty string when second argument is null', () => {
		ok(opt(x => x, null) === '');
	});
});

describe('Unit Utils getEnv', () => {
	let statStub: SinonStub;
	let readFileStub: SinonStub;
	let parseStub: SinonStub;
	let isInteractiveStub: SinonStub;
	let consentSelectionStub: SinonStub;
	let promptStub: SinonStub;

	// We will assign getEnv after proxyquiring utils
	let getEnv: () => Promise<Array<{ name: string; value: string }>>;

	beforeEach(() => {
		statStub = stub(fs, 'stat');
		readFileStub = stub(fs, 'readFile');

		parseStub = stub().callsFake((content: string) => {
			return content
				.split('\n')
				.filter(line => line.trim().length > 0)
				.reduce((acc: Record<string, string>, line) => {
					const [k, v] = line.split('=');
					acc[k] = v;
					return acc;
				}, {});
		});

		isInteractiveStub = stub().returns(true);
		consentSelectionStub = stub().resolves(false);
		promptStub = stub().resolves({ env: '' });

		type GetEnvFunction = () => Promise<{ name: string; value: string }[]>;
		const { getEnv: importedGetEnv } = proxyquire('../utils', {
			dotenv: { parse: parseStub },
			'./cli/selection': { consentSelection: consentSelectionStub },
			'./tty': { isInteractive: isInteractiveStub },
			inquirer: { prompt: promptStub }
		}) as { getEnv: GetEnvFunction };

		getEnv = importedGetEnv;
	});

	afterEach(() => {
		restore();
	});

	it('should return empty array when .env file does not exist and user declines to add env vars', async () => {
		// fs.stat rejects => your exists() will interpret that as "file not found"
		statStub.rejects(new Error('ENOENT'));
		consentSelectionStub.resolves(false);

		const result = await getEnv();
		deepStrictEqual(result, []);
	});

	it('should parse and return env variables if .env does not exist but user consents to add them', async () => {
		statStub.rejects(new Error('ENOENT'));
		isInteractiveStub.returns(true);
		consentSelectionStub.resolves(true);
		promptStub.resolves({ env: 'KEY1=Val1, KEY2=Val2' });

		const result = await getEnv();

		strictEqual(result.length, 2, 'Should have two entries');
		deepStrictEqual(
			result.find(item => item.name === 'KEY1')?.value,
			'Val1'
		);
		deepStrictEqual(
			result.find(item => item.name === 'KEY2')?.value,
			'Val2'
		);
	});

	it('should return parsed env variables from .env if it exists', async () => {
		// If file exists
		statStub.resolves({} as unknown);
		readFileStub.resolves(`KEY1=Val1\nKEY2=Val2`);

		const result = await getEnv();
		const expected = [
			{ name: 'KEY1', value: 'Val1' },
			{ name: 'KEY2', value: 'Val2' }
		];
		deepStrictEqual(result, expected);
	});

	it('should handle errors when reading the .env file fails', async () => {
		statStub.resolves({} as unknown);
		readFileStub.rejects(new Error('File read error'));
		const consoleErrorStub = stub(console, 'error');
		const result = await getEnv();
		// Ensure it logs an error
		strictEqual(consoleErrorStub.called, true);
		// Restore console.error
		consoleErrorStub.restore();
		deepStrictEqual(result, []);
	});

	it('should return empty array if terminal is not interactive and .env does not exist', async () => {
		statStub.rejects(new Error('ENOENT'));
		isInteractiveStub.returns(false);

		const result = await getEnv();
		deepStrictEqual(result, []);
	});
});
