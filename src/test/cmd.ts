import concat from 'concat-stream';
import spawn from 'cross-spawn';
import { existsSync } from 'fs';
import { constants } from 'os';

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
