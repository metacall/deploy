import API from '@metacall/protocol/protocol';
import { fail } from 'assert';
import concat from 'concat-stream';
import spawn from 'cross-spawn';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import inspector from 'inspector';
import os from 'os';
import { join } from 'path';
import args from '../cli/args';
import { configFilePath } from '../config';
import { startup } from '../startup';
import { exists } from '../utils';

dotenv.config();

// Define tty as interactive in order to test properly the CLI
process.env.NODE_ENV = 'testing';
process.env.METACALL_DEPLOY_INTERACTIVE = 'true';

const PATH = process.env.PATH;
const HOME = process.env.HOME;

export const isInDebugMode = () => inspector.url() !== undefined;

export const run = (
	path: string,
	args: string[] = [],
	env: Record<string, string> = {}
) => {
	if (!path || !existsSync(path)) {
		throw new Error('Invalid process path');
	}

	// TODO: Implement this properly for better debugging
	/* const debugArgs = isInDebugMode() ? ['--inspect-brk=0'] : []; */

	const child = spawn('node', [/*...debugArgs,*/ path, ...args], {
		env: Object.assign(
			{
				NODE_ENV: 'test',
				PATH,
				HOME
			},
			env
		),
		stdio: [null, null, null, 'ipc']
	});

	child.stdin?.setDefaultEncoding('utf-8');

	return child;
};

export const runWithInput = (
	path: string,
	args: string[] = [],
	inputs: string[] = [],
	env: Record<string, string> = {}
) => {
	const child = run(path, args, env);
	let childTimeout: NodeJS.Timeout, killTimeout: NodeJS.Timeout;

	const loop = (inputs: string[]) => {
		if (killTimeout) {
			clearTimeout(killTimeout);
		}

		if (
			inputs.length === 0 ||
			(inputs.length > 0 && inputs[0] === keys.kill)
		) {
			child.stdin?.end();

			killTimeout = setTimeout(() => {
				child.kill(os.constants.signals.SIGTERM);
			}, 3000);

			return;
		}

		childTimeout = setTimeout(() => {
			child.stdin?.cork();
			child.stdin?.write(inputs.shift());
			child.stdin?.uncork();
			loop(inputs);
		}, 3000);
	};

	const stderrChunks: Buffer[] = [];
	child.stderr?.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

	const isRealError = (stderrText: string): boolean => {
		const trimmed = stderrText.trim();
		if (!trimmed) return false;
		// Ignore Node deprecation warnings (e.g. util.isArray, DEP0044)
		if (/DeprecationWarning|DEP\d+|util\.isArray/i.test(trimmed))
			return false;
		if (/\(node:\d+\)\s*\[DEP/.test(trimmed)) return false;
		// Real errors: CLI error prefix or HTTP/request errors
		return (
			trimmed.startsWith('X ') ||
			trimmed.startsWith('! ') ||
			trimmed.startsWith('Error:') ||
			/Request failed|status code \d{3}/.test(trimmed)
		);
	};

	return {
		promise: new Promise((resolve, reject) => {
			child.on('error', reject);

			loop(inputs);

			child.stdout?.pipe(
				concat(result => {
					if (killTimeout) clearTimeout(killTimeout);
					if (childTimeout) clearTimeout(childTimeout);
					const stderrText = Buffer.concat(stderrChunks).toString();
					if (isRealError(stderrText)) {
						child.stdin?.end();
						reject(stderrText);
					} else {
						resolve(result.toString());
					}
				})
			);

			// If process exits before stdout ends, settle with buffered stderr
			child.on('close', (code, signal) => {
				if (childTimeout) clearTimeout(childTimeout);
				if (code !== 0 && signal !== 'SIGTERM') {
					const stderrText = Buffer.concat(stderrChunks).toString();
					if (isRealError(stderrText)) reject(stderrText);
				}
			});
		}),
		child
	};
};

export const keys = Object.freeze({
	up: '\u001b[A',
	down: '\u001b[B',
	left: '\u001b[D',
	right: '\u001b[C',
	enter: '\n',
	space: ' ',
	kill: '^C'
});

export const deployed = async (suffix: string): Promise<boolean> => {
	const config = await startup(args['confDir']);
	const baseURL =
		process.env.TEST_DEPLOY_LOCAL === 'true'
			? config.devURL
			: config.baseURL;
	const api = API(config.token as string, baseURL);

	const sleep = (ms: number): Promise<ReturnType<typeof setTimeout>> =>
		new Promise(resolve => setTimeout(resolve, ms));
	let res = false,
		wait = true;
	while (wait) {
		await sleep(1000);
		const inspect = await api.inspect();

		const deployIdx = inspect.findIndex(deploy => deploy.suffix === suffix);
		if (deployIdx !== -1) {
			switch (inspect[deployIdx].status) {
				case 'create':
					break;
				case 'ready':
					wait = false;
					res = true;
					break;
				default:
					wait = false;
					res = false;
					break;
			}
		}
	}

	return res;
};

export const deleted = async (suffix: string): Promise<boolean> => {
	const config = await startup(args['confDir']);
	const baseURL =
		process.env.TEST_DEPLOY_LOCAL === 'true'
			? config.devURL
			: config.baseURL;
	const api = API(config.token as string, baseURL);

	const sleep = (ms: number): Promise<ReturnType<typeof setTimeout>> =>
		new Promise(resolve => setTimeout(resolve, ms));
	let res = false,
		wait = true;
	while (wait) {
		await sleep(1000);
		const inspect = await api.inspect();

		const deployIdx = inspect.findIndex(deploy => deploy.suffix === suffix);
		if (deployIdx === -1) {
			wait = false;
			res = true;
		}
	}

	return res;
};

export const generateRandomString = (length: number): string => {
	let result = '';
	const characters =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;

	for (let i = 0; i < length; i++) {
		result += characters.charAt(
			Math.floor(Math.random() * charactersLength)
		);
	}

	return result;
};

export const runCLI = (args: string[], inputs: string[]) => {
	const useLocal = process.env.TEST_DEPLOY_LOCAL === 'true';
	if (useLocal) {
		args.push('--dev');
	}
	const env: Record<string, string> = useLocal
		? { TEST_DEPLOY_LOCAL: 'true' }
		: {};
	return runWithInput('dist/index.js', args, inputs, env);
};

export const clearCache = async (): Promise<void> => {
	if (await exists(configFilePath()))
		await runCLI(['-l'], [keys.enter]).promise;
};

export const checkEnvVars = (): { email: string; password: string } | never => {
	const email = process.env.METACALL_AUTH_EMAIL;
	const password = process.env.METACALL_AUTH_PASSWORD;

	if (typeof email === 'undefined' || typeof password === 'undefined') {
		fail(
			'No environment files present to test the below flags, please set up METACALL_AUTH_EMAIL and METACALL_AUTH_PASSWORD'
		);
	}

	return { email, password };
};

export const createTmpDirectory = async (): Promise<string> => {
	return await fs.mkdtemp(join(os.tmpdir(), `dep-`));
};
