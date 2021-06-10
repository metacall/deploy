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
