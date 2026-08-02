import login from '@metacall/protocol/login';
import API, { API as APIInterface } from '@metacall/protocol/protocol';
import { ok } from 'assert';
import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';
import args from '../cli/args';
import * as selectionModule from '../cli/selection';
import { Config, configFilePath, defaultPath, load } from '../config';
import * as logsModule from '../logs';
import * as startupModule from '../startup';
import { exists } from '../utils';

dotenv.config();

type Writable<T> = { -readonly [K in keyof T]: T[K] };

export type AuthContext = {
	config: Config & { token: string };
	api: APIInterface;
};

export const getAPI = async (confDir?: string): Promise<AuthContext> => {
	const config = await load(confDir ?? args['confDir'] ?? defaultPath);

	let token = process.env['METACALL_API_KEY'] || config.token || '';

	if (!token) {
		const email = process.env['METACALL_AUTH_EMAIL'] || '';
		const password = process.env['METACALL_AUTH_PASSWORD'] || '';

		ok(
			email && password,
			'No token found and no METACALL_AUTH_EMAIL/PASSWORD set in .env'
		);

		token = await login(email, password, config.baseURL);
	}

	ok(token, 'Failed to obtain auth token');

	return {
		config: { ...config, token } as Config & { token: string },
		api: API(token, config.baseURL)
	};
};

const originals = {
	startup: startupModule.startup,
	logs: logsModule.logs,
	listSelection: selectionModule.listSelection,
	consentSelection: selectionModule.consentSelection,
	processExit: process.exit.bind(process)
};

export const StartupMock = {
	install(config: Config & { token: string }): void {
		const mutableStartup = startupModule as Writable<typeof startupModule>;
		const mutableLogs = logsModule as Writable<typeof logsModule>;

		mutableStartup.startup = () => Promise.resolve(config);
		mutableLogs.logs = () => Promise.resolve();
	},

	restore(): void {
		const mutableStartup = startupModule as Writable<typeof startupModule>;
		const mutableLogs = logsModule as Writable<typeof logsModule>;

		mutableStartup.startup = originals.startup;
		mutableLogs.logs = originals.logs;
	}
};

export type SelectionMockOptions = {
	listChoice: 'first' | 'last' | number;
	consent: boolean;
};

const selectionDefaults: SelectionMockOptions = {
	listChoice: 'first',
	consent: false
};

export const SelectionMock = {
	install(opts: Partial<SelectionMockOptions> = {}): void {
		const { listChoice, consent } = { ...selectionDefaults, ...opts };
		const mutable = selectionModule as Writable<typeof selectionModule>;

		mutable.listSelection = (
			choices: Array<string | { name: string; value: string }>
		): Promise<string> => {
			const idx =
				listChoice === 'first'
					? 0
					: listChoice === 'last'
						? choices.length - 1
						: listChoice;

			const choice =
				choices[Math.min(idx, choices.length - 1)] ?? choices[0];
			return Promise.resolve(
				typeof choice === 'string' ? choice : choice.value
			);
		};

		mutable.consentSelection = (): Promise<boolean> =>
			Promise.resolve(consent);
	},

	restore(): void {
		const mutable = selectionModule as Writable<typeof selectionModule>;

		mutable.listSelection = originals.listSelection;
		mutable.consentSelection = originals.consentSelection;
	}
};

export const ProcessExitMock = {
	install(): void {
		process.exit = ((code?: number): never => {
			throw new Error(`process.exit(${code ?? 0})`);
		}) as typeof process.exit;
	},

	restore(): void {
		process.exit = originals.processExit;
	}
};

export const clearCache = async (): Promise<void> => {
	const path = configFilePath();
	if (await exists(path)) {
		await fs.unlink(path);
	}
};
