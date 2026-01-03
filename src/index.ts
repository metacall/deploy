#!/usr/bin/env node

import { createCLI } from './utils/cliSetup';
import { handleCLIError } from './utils/cliErrorHandler';

async function runCLI(): Promise<void> {
	const cli = createCLI();
	const args = process.argv.slice(2);

	try {
		await cli.runExit(args, {
			stdin: process.stdin,
			stdout: process.stdout,
			stderr: process.stderr
		});
	} catch (error) {
		handleCLIError(error, args);
	}
}

void runCLI();
