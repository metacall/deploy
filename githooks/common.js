const { spawn } = require('child_process');

const debug = !!process.env.DEBUG_HOOKS;
const debugLog = debug ? ((...params) => console.log(...params)) : (() => {});

const run = (cmd, args = [], config = {}) => new Promise((ok, nope) => {
	const child = spawn(cmd, args, config);
	
	let stderr = '';
	let stdout = '';

	child.stderr.on('data', data => {
		stderr += data
		debugLog('> stderr:', data.toString().trim());
	});
	child.stdout.on('data', data => {
		stdout += data
		debugLog('> stdout:', data.toString().trim());
	});
	child.on('close', (code, signal) => {
		if (code !== 0) {
			console.error('Exited with code', code);
			return nope({
				message: stderr,
				exit: code,
				data: { code, signal, stderr, stdout, child }
			});
		}
		ok({ code, signal, stderr, stdout, child });
	});
});

module.exports = {
	debug,
	debugLog,
	run
};