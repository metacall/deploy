import { LanguageId } from '@metacall/protocol/deployment';
import { Languages } from '@metacall/protocol/language';
import { ProtocolError } from '@metacall/protocol/protocol';
import chalk from 'chalk';

// Output mode configuration
let outputMode: 'normal' | 'quiet' | 'verbose' | 'json' = 'normal';

export const setOutputMode = (
	mode: 'normal' | 'quiet' | 'verbose' | 'json'
): void => {
	outputMode = mode;
};

export const getOutputMode = (): 'normal' | 'quiet' | 'verbose' | 'json' =>
	outputMode;

export const isQuiet = (): boolean => outputMode === 'quiet';
export const isVerbose = (): boolean => outputMode === 'verbose';
export const isJson = (): boolean => outputMode === 'json';

/**
 * Log informational message (suppressed in quiet mode)
 */
export const info = (message: string): void => {
	if (isQuiet()) return;
	if (isJson()) return;
	// eslint-disable-next-line no-console
	console.log(chalk.cyanBright.bold('i') + ' ' + chalk.cyan(message));
};

/**
 * Log warning message (shown in all modes except json)
 */
export const warn = (message: string): void => {
	if (isJson()) return;
	// eslint-disable-next-line no-console
	console.warn(chalk.yellowBright.bold('!') + ' ' + chalk.yellow(message));
};

/**
 * Log debug/verbose message (only shown in verbose mode)
 */
export const debug = (message: string): void => {
	if (!isVerbose()) return;
	// eslint-disable-next-line no-console
	console.log(chalk.gray('  [debug] ' + message));
};

/**
 * Log success message
 */
export const success = (message: string): void => {
	if (isQuiet()) return;
	if (isJson()) return;
	// eslint-disable-next-line no-console
	console.log(chalk.greenBright.bold('✓') + ' ' + chalk.green(message));
};

/**
 * Log error and exit (always shown)
 */
export const error = (message: string, exitCode = 1): never => {
	if (isJson()) {
		// eslint-disable-next-line no-console
		console.error(JSON.stringify({ error: message, exitCode }));
	} else {
		// eslint-disable-next-line no-console
		console.error(chalk.redBright.bold('X') + ' ' + chalk.red(message));
	}
	return process.exit(exitCode);
};

/**
 * Log API error and exit (always shown)
 */
export const apiError = (err: ProtocolError): never => {
	const status = err.response?.status || 'unknown';
	const data = err.response?.data as string;

	if (isJson()) {
		// eslint-disable-next-line no-console
		console.error(
			JSON.stringify({
				error: 'API Error',
				status,
				message: data,
				exitCode: 1
			})
		);
	} else {
		// eslint-disable-next-line no-console
		console.error(
			chalk.redBright.bold('X') +
				chalk.redBright(
					` Server responded with error code: ${status} ${data}`
				)
		);
	}
	return process.exit(1);
};

/**
 * Output JSON data (only in json mode)
 */
export const jsonOutput = (data: unknown): void => {
	if (!isJson()) return;
	// eslint-disable-next-line no-console
	console.log(JSON.stringify(data, null, 2));
};

/**
 * Format language name with color
 */
export const printLanguage = (language: LanguageId): string =>
	chalk
		.hex(Languages[language].hexColor)
		.bold(Languages[language].displayName);

/**
 * Print a styled header
 */
export const header = (text: string): void => {
	if (isQuiet() || isJson()) return;
	// eslint-disable-next-line no-console
	console.log('\n' + chalk.bold.underline(text) + '\n');
};

/**
 * Print a step indicator
 */
export const step = (stepNum: number, total: number, message: string): void => {
	if (isQuiet() || isJson()) return;
	// eslint-disable-next-line no-console
	console.log(chalk.dim(`[${stepNum}/${total}]`) + ' ' + message);
};
