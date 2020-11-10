import chalk from 'chalk';

export const info = (message: any, ret = null) => {
	// eslint-disable-next-line no-console
	console.warn(chalk.cyanBright.bold('i') + ' ' + chalk.cyan(message));
	return ret;
};

export const debug = (message: any, ret = null) => {
	// eslint-disable-next-line no-console
	console.warn(chalk.yellowBright.bold('!') + ' ' + chalk.yellow(message));
	return ret;
};

export const fatal = (message: any) => {
	// eslint-disable-next-line no-console
	console.error(chalk.redBright.bold('X') + ' ' + chalk.red(message));
	return process.exit(1);
};
