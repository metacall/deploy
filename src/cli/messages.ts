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

export const error = (message: string): never => {
	// eslint-disable-next-line no-console
	console.error(chalk.redBright.bold('X') + ' ' + chalk.red(message));
	return process.exit(1);
};
export const apiError = (err: ProtocolError): never => {
	// eslint-disable-next-line no-console
	console.error(
		chalk.redBright.bold('X') +
			chalk.redBright(
				` Server responded with error code: ${
					err.response?.status || ''
				} ${err.response?.data as string}`
			)
	);
	return process.exit(1);
};

export const printLanguage = (language: LanguageId): string =>
	chalk
		.hex(Languages[language].hexColor)
		.bold(Languages[language].displayName);
