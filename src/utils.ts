import chalk from 'chalk';

export const info = (message: any, ret = null) => {
	// eslint-disable-next-line no-console
	console.warn(
		chalk.cyan.bold('i') + ' ' +
		chalk.cyan(message));
	return ret;
};

export const debug = (message: any, ret = null) => {
	// eslint-disable-next-line no-console
	console.warn(
		chalk.yellow.bold('!') + ' ' +
		chalk.yellow(message));
	return ret;
};

export const fatal = (message: any) => {
	// eslint-disable-next-line no-console
	console.error(
		chalk.red.bold('X') + ' ' +
		chalk.red(message));
	return process.exit(1);
};
