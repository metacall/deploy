import API from '@metacall/protocol/protocol';
import { fail } from 'assert';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import inspector from 'inspector';
import * as pty from 'node-pty';
import os from 'os';
import { join } from 'path';
import { stripVTControlCharacters } from 'util';
import args from '../cli/args';
import { configFilePath } from '../config';
import { startup } from '../startup';
import { exists } from '../utils';

dotenv.config();

// Define tty as interactive in order to test properly the CLI
process.env.NODE_ENV = 'testing';
process.env.METACALL_DEPLOY_INTERACTIVE = 'true';

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

	const child = pty.spawn('node', [/*...debugArgs,*/ path, ...args], {
		name: 'xterm-color',
		cols: 80,
		rows: 30,
		cwd: process.cwd(),
		env: {
			...process.env,
			NODE_ENV: 'test',
			...env
		}
	});

	return child;
};

export const runWithInput = (
	path: string,
	args: string[] = [],
	inputs: string[] = [],
	env: Record<string, string> = {}
) => {
	const child = run(path, args, env);

	return {
		promise: new Promise((resolve, reject) => {
			let output = '';

			child.onData(data => {
				output += stripVTControlCharacters(data);
			});

			child.onExit(({ exitCode }) => {
				if (exitCode === 0) {
					resolve(output);
				} else {
					reject({
						output,
						exitCode
					});
				}
			});

			for (const input of inputs) {
				child.write(input);
			}
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
	const api = API(config.token as string, config.baseURL);

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
	const api = API(config.token as string, config.baseURL);

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
	if (process.env.TEST_DEPLOY_LOCAL === 'true') {
		args.push('--dev');
	}
	return runWithInput('dist/index.js', args, inputs);
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
