import { LogLevel } from '../constants/logging.constants';

export interface Logger {
	info(message: string, ...args: unknown[]): void;
	warn(message: string, ...args: unknown[]): void;
	error(message: string, ...args: unknown[]): void;
	debug(message: string, ...args: unknown[]): void;
	success?(message: string, ...args: unknown[]): void;
}

export interface LoggerConfig {
	level?: LogLevel;
	color?: boolean;
	timestamp?: boolean;
	output?: NodeJS.WritableStream;
	errorOutput?: NodeJS.WritableStream;
}
