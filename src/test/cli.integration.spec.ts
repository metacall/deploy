import { ok } from 'assert';
import { spawn } from 'child_process';

const keys = Object.freeze({
	up: '\u001b[A',
	down: '\u001b[B',
	left: '\u001b[D',
	right: '\u001b[C',
	enter: '\n',
	space: ' ',
	kill: '^C'
});

const outputSkip = '__TEST_OUTPUT_SKIP__';

const runCLI = (inputs: string[], outputs: string[]): Promise<number> =>
	new Promise((resolve, reject) => {
		const child = spawn('node', ['dist/index.js']);
		child.stdin.setDefaultEncoding('utf-8');

		const timeout = setTimeout(() => {
			child.kill('SIGINT');
		}, 90000);

		const kill = () => {
			clearTimeout(timeout);
			setTimeout(() => child.kill('SIGINT'), 0);
		};

		child.stdout.on('data', data => {
			const trimData = String(data).replace(
				/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
				''
			);
			if (trimData !== '') {
				const output = outputs.shift();

				ok(output !== undefined);

				if (output !== outputSkip) {
					const comparison = String(output) === String(trimData);

					if (!comparison) {
						const getDifference = (a: string, b: string) => {
							let i = 0;
							let j = 0;
							let result = '';

							while (j < b.length) {
								if (a[i] != b[j] || i == a.length)
									result += b[j];
								else i++;
								j++;
							}
							return result;
						};
						const diff = getDifference(
							String(output),
							String(trimData)
						);
						const hex = Buffer.from(diff).toString('hex');
						console.log(
							`The CLI has shown a different output from the test
                            Showing in ascii the difference where it does start: "${diff}"
                            Showing in hexadecimal the difference where it does start: "${hex}"`
						);
					}

					ok(comparison);

					const input = inputs.shift();

					if (input === keys.kill) {
						console.log('killing');
						kill();
						return;
					}

					child.stdin.cork();
					child.stdin.write(input);
					child.stdin.uncork();
				}
			}

			if (outputs.length === 0 && inputs.length === 0) {
				kill();
			}
		});

		child.on('close', code => {
			console.log('code:', String(code));
			clearTimeout(timeout);
			return code === 0 ? resolve(code) : reject(code);
		});
	});

describe('integration cli', function () {
	this.timeout(200_000);

	// Invalid Token Login
	it('Should fail with malformed jwt', async () => {
		const code = await runCLI(
			[keys.enter, 'yeet', keys.enter, keys.kill],
			[
				'? Select the login method (Use arrow keys)\n❯ Login by token \n  Login by email and password',
				outputSkip,
				'? Select the login method Login by token',
				'? Please enter your metacall token '
			]
		);
		// ok(result === 'Deploy Delete Succeed')
		console.log('exitCode', code);
	});
});
