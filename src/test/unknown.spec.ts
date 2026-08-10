import { strictEqual } from 'assert';
import { ErrorCode } from '../deploy';
import { printHelp } from '../help';
import args from '../cli/args';
import { handleUnknownArgs } from '../cli/unknown';

/**
 * Stubs process.exit so it doesn't terminate the test runner.
 * Returns the captured exit code via a thrown sentinel error.
 */
const captureExitCode = (fn: () => void): number => {
	/* eslint-disable @typescript-eslint/unbound-method */
	const original = process.exit;
	const originalLog = console.log;
	/* eslint-enable @typescript-eslint/unbound-method */

	let captured: number | undefined;

	// Suppress help text output during tests
	console.log = () => undefined;

	process.exit = ((code?: number) => {
		captured = code ?? 0;
		throw new Error(`__process_exit__:${captured}`);
	}) as typeof process.exit;

	try {
		fn();
	} catch (e) {
		if (
			!(e instanceof Error) ||
			!e.message.startsWith('__process_exit__')
		) {
			process.exit = original;
			console.log = originalLog;
			throw e;
		}
	} finally {
		process.exit = original;
		console.log = originalLog;
	}

	if (captured === undefined) {
		throw new Error('process.exit was never called');
	}

	return captured;
};

// printHelp
describe('printHelp exit codes', () => {
	it('exits with 0 (ErrorCode.Ok) when called with no argument', () => {
		const code = captureExitCode(() => printHelp());
		strictEqual(code, ErrorCode.Ok);
	});

	it('exits with ErrorCode.Ok (0) when called with ErrorCode.Ok explicitly', () => {
		const code = captureExitCode(() => printHelp(ErrorCode.Ok));
		strictEqual(code, ErrorCode.Ok);
	});

	it('exits with ErrorCode.InvalidArguments (7) when called with ErrorCode.InvalidArguments', () => {
		const code = captureExitCode(() =>
			printHelp(ErrorCode.InvalidArguments)
		);
		strictEqual(code, ErrorCode.InvalidArguments);
	});

	it('exits with the exact numeric code passed in', () => {
		// Verify the parameter is forwarded faithfully for any code value
		const code = captureExitCode(() =>
			printHelp(ErrorCode.DeployPackageFailed)
		);
		strictEqual(code, ErrorCode.DeployPackageFailed);
	});
});

// handleUnknownArgs
describe('handleUnknownArgs exit codes', () => {
	// Keep originals so we can restore after each test
	let originalUnknown: string[];

	before(() => {
		originalUnknown = (args as unknown as Record<string, unknown>)[
			'_unknown'
		] as string[];
	});

	after(() => {
		(args as unknown as Record<string, unknown>)['_unknown'] =
			originalUnknown;
	});

	const setUnknown = (flags: string[]) => {
		(args as unknown as Record<string, unknown>)['_unknown'] = flags;
	};

	it('exits with ErrorCode.InvalidArguments when an unknown flag is passed', () => {
		setUnknown(['--not-a-real-flag']);
		const code = captureExitCode(() => handleUnknownArgs());
		strictEqual(code, ErrorCode.InvalidArguments);
	});

	it('exits with ErrorCode.InvalidArguments for multiple unknown flags', () => {
		setUnknown(['--foo', '--bar']);
		const code = captureExitCode(() => handleUnknownArgs());
		strictEqual(code, ErrorCode.InvalidArguments);
	});

	it('exits with ErrorCode.Ok (0) when --help is the only flag', () => {
		setUnknown(['--help']);
		const code = captureExitCode(() => handleUnknownArgs());
		strictEqual(code, ErrorCode.Ok);
	});

	it('exits with ErrorCode.Ok (0) when -h is the only flag', () => {
		setUnknown(['-h']);
		const code = captureExitCode(() => handleUnknownArgs());
		strictEqual(code, ErrorCode.Ok);
	});

	it('exits with ErrorCode.InvalidArguments when --help is combined with other flags', () => {
		setUnknown(['--help', '--extra']);
		const code = captureExitCode(() => handleUnknownArgs());
		strictEqual(code, ErrorCode.InvalidArguments);
	});
});
