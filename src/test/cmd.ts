import API from '@metacall/protocol/protocol';
import concat from 'concat-stream';
import spawn from 'cross-spawn';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { constants } from 'os';
import args from '../cli/args';
import { startup } from '../startup';

dotenv.config();

const PATH = process.env.PATH;
const HOME = process.env.HOME;

export const run = (
	path: string,
	args: string[] = [],
	env: Record<string, string> = {}
) => {
	if (!path || !existsSync(path)) {
		throw new Error('Invalid process path');
	}

	const child = spawn('node', [path, ...args], {
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
				child.kill(constants.signals.SIGTERM);
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

	return {
		promise: new Promise((resolve, reject) => {
			child.stderr?.once('data', err => {
				child.stdin?.end();

				if (childTimeout) {
					clearTimeout(childTimeout);
					inputs = [];
				}
				reject(String(err));
			});

			child.on('error', reject);

			loop(inputs);

			child.stdout?.pipe(
				concat(result => {
					if (killTimeout) {
						clearTimeout(killTimeout);
					}

					resolve(result.toString());
				})
			);
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
