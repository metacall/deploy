import API, { waitFor } from '@metacall/protocol/protocol';
import { fail } from 'assert';
import spawn from 'cross-spawn';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import inspector from 'inspector';
import os from 'os';
import { join } from 'path';
import { stripVTControlCharacters } from 'util';
import args from '../cli/args';
import { configFilePath } from '../config';
import { deletedDeploy } from '../delete';
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

	const child = spawn(
		'node',
		[/*...debugArgs,*/ '--no-warnings', path, ...args],
		{
			env: Object.assign(
				{
					NODE_ENV: 'test',
					PATH,
					HOME
				},
				env
			),
			stdio: [null, null, null, 'ipc']
		}
	);

	child.stdin?.setDefaultEncoding('utf-8');

	return child;
};

export const runWithInput = (
	path: string,
	args: string[] = [],
	inputs: string[] = [],
	env: Record<string, string> = {},
	discardExitCode = true
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
			}, 10000);

			return;
		}

		childTimeout = setTimeout(() => {
			child.stdin?.cork();
			child.stdin?.write(inputs.shift());
			child.stdin?.uncork();
			loop(inputs);
		}, 5000);
	};

	const removeTrailingNewline = (str: string) =>
		str.endsWith('\r\n')
			? str.slice(0, -2)
			: str.endsWith('\n')
			? str.slice(0, -1)
			: str;

	return {
		promise: new Promise<string>((resolve, reject) => {
			const chunks: string[] = [];

			child.stderr?.once('data', err => {
				child.stdin?.end();

				if (childTimeout) {
					clearTimeout(childTimeout);
					inputs = [];
				}

				const message = String(err);
				console.error(removeTrailingNewline(message));
				reject(message);
			});

			child.on('error', reject);

			loop(inputs);

			child.on('exit', exitCode => {
				const output = chunks.map(stripVTControlCharacters).join('');

				if (discardExitCode === false && exitCode !== 0) {
					reject({
						exitCode,
						output
					});
				} else {
					resolve(output);
				}
			});

			child.stdout?.on('data', chunk => {
				if (killTimeout) {
					clearTimeout(killTimeout);
				}

				const message = String(chunk);

				console.log(removeTrailingNewline(message));
				chunks.push(message);
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
	const api = API(config.token as string, config.baseURL);

	return await waitFor(async () => {
		const inspect = await api.inspect();
		const deployIdx = inspect.findIndex(deploy => deploy.suffix === suffix);
		if (deployIdx !== -1) {
			switch (inspect[deployIdx].status) {
				case 'ready':
					return true;
				case 'create':
					throw new Error('Deploy not ready yet');
				case 'fail':
					return false;
			}
		}

		throw new Error('Not deployed yet');
	});
};

export const deleted = async (suffix: string): Promise<boolean> => {
	const config = await startup(args['confDir']);
	const api = API(config.token as string, config.baseURL);

	return await deletedDeploy(suffix, api);
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
