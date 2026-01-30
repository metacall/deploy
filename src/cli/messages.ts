import { LanguageId } from '@metacall/protocol/deployment';
import { Languages } from '@metacall/protocol/language';
import { ProtocolError } from '@metacall/protocol/protocol';
import chalk from 'chalk';

export const info = (message: string): void => {
	// eslint-disable-next-line no-console
	console.log(chalk.cyanBright.bold('i') + ' ' + chalk.cyan(message));
};

export const warn = (message: string): void => {
	// eslint-disable-next-line no-console
	console.warn(chalk.yellowBright.bold('!') + ' ' + chalk.yellow(message));
};

export const error = (message: string, exitCode = 1): never => {
	// eslint-disable-next-line no-console
	console.error(chalk.redBright.bold('X') + ' ' + chalk.red(message));
	return process.exit(exitCode);
};
export const apiError = (err: ProtocolError): never => {
	const response = err.response as
		| { status?: number; data?: unknown }
		| undefined;
	const status =
		response && typeof response.status === 'number'
			? response.status
			: undefined;
	const data = response?.data;
	const statusStr = status !== undefined ? String(status) : '';
	const dataStr =
		data !== undefined && data !== null
			? String(data)
			: String(err.message ?? '');
	// eslint-disable-next-line no-console
	console.error(
		chalk.redBright.bold('X') +
			chalk.redBright(
				` Server responded with error code: ${statusStr} ${dataStr}`.trim()
			)
	);
	return process.exit(1);
};

export const printLanguage = (language: LanguageId): string =>
	chalk
		.hex(Languages[language].hexColor)
		.bold(Languages[language].displayName);
