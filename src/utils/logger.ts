import chalk from 'chalk';
import { LogLevel, getDefaultLogLevel } from '../constants/logging.constants';
import { Logger, LoggerConfig } from '../types/logger.types';

export class LoggerUtil implements Logger {
	private readonly config: Required<LoggerConfig>;
	private readonly isInteractive: boolean;

	constructor(config: Partial<LoggerConfig> = {}) {
		const defaultColor = process.stdout.isTTY && !process.env.NO_COLOR;
		this.config = {
			level: config.level ?? getDefaultLogLevel(),
			color: config.color ?? defaultColor,
			timestamp: config.timestamp ?? false,
			output: config.output ?? process.stdout,
			errorOutput: config.errorOutput ?? process.stderr
		};

		this.isInteractive = process.stdout.isTTY && !process.env.CI;
	}

	info(message: string, ...args: unknown[]): void {
		if (this.config.level > LogLevel.INFO) {
			return;
		}

		const formatted = this.formatMessage('info', message);
		this.write(this.config.output, formatted, ...args);
	}

	warn(message: string, ...args: unknown[]): void {
		if (this.config.level > LogLevel.WARN) {
			return;
		}

		const formatted = this.formatMessage('warn', message);
		this.write(this.config.errorOutput, formatted, ...args);
	}

	error(message: string, ...args: unknown[]): void {
		if (this.config.level > LogLevel.ERROR) {
			return;
		}

		const formatted = this.formatMessage('error', message);
		this.write(this.config.errorOutput, formatted, ...args);
	}

	debug(message: string, ...args: unknown[]): void {
		if (this.config.level > LogLevel.DEBUG) {
			return;
		}

		const formatted = this.formatMessage('debug', message);
		this.write(this.config.output, formatted, ...args);
	}

	success(message: string, ...args: unknown[]): void {
		if (this.config.level > LogLevel.INFO) {
			return;
		}

		const formatted = this.formatMessage('success', message);
		this.write(this.config.output, formatted, ...args);
	}

	private formatMessage(level: 'info' | 'warn' | 'error' | 'debug' | 'success', message: string): string {
		let prefix = '';
		let styledMessage = message;

		if (this.config.color) {
			switch (level) {
				case 'info':
					prefix = chalk.blue('ℹ');
					break;
				case 'warn':
					prefix = chalk.yellow('⚠');
					styledMessage = chalk.yellow(message);
					break;
				case 'error':
					prefix = chalk.red('✖');
					styledMessage = chalk.red(message);
					break;
				case 'debug':
					prefix = chalk.gray('●');
					styledMessage = chalk.gray(message);
					break;
				case 'success':
					prefix = chalk.green('✓');
					styledMessage = chalk.green(message);
					break;
			}
		} else {
			switch (level) {
				case 'info':
					prefix = '[INFO]';
					break;
				case 'warn':
					prefix = '[WARN]';
					break;
				case 'error':
					prefix = '[ERROR]';
					break;
				case 'debug':
					prefix = '[DEBUG]';
					break;
				case 'success':
					prefix = '[SUCCESS]';
					break;
			}
		}

		const timestamp = this.config.timestamp ? this.getTimestamp() : '';

		return [timestamp, prefix, styledMessage].filter(Boolean).join(' ');
	}

	private getTimestamp(): string {
		const now = new Date();
		return this.config.color ? chalk.gray(`[${now.toISOString()}]`) : `[${now.toISOString()}]`;
	}

	private write(stream: NodeJS.WritableStream, message: string, ...args: unknown[]): void {
		const output = args.length > 0 ? `${message} ${this.formatArgs(args)}\n` : `${message}\n`;
		stream.write(output);
	}

	private formatArgs(args: unknown[]): string {
		return args
			.map(arg => {
				if (typeof arg === 'object' && arg !== null) {
					return JSON.stringify(arg, null, 2);
				}
				return String(arg);
			})
			.join(' ');
	}

	isInteractiveMode(): boolean {
		return this.isInteractive;
	}

	child(config: Partial<LoggerConfig>): LoggerUtil {
		return new LoggerUtil({ ...this.config, ...config });
	}
}

let defaultLogger: LoggerUtil | null = null;

export function getLogger(config?: Partial<LoggerConfig>): LoggerUtil {
	if (!defaultLogger || config) {
		defaultLogger = new LoggerUtil(config);
	}
	return defaultLogger;
}

export function createLogger(config?: Partial<LoggerConfig>): LoggerUtil {
	return new LoggerUtil(config);
}

export function createLoggerInterface(config?: Partial<LoggerConfig>): Logger {
	return getLogger(config);
}
