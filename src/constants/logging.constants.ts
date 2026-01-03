export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3
}

export const getDefaultLogLevel = (): LogLevel => {
	return process.env.DEBUG ? LogLevel.DEBUG : LogLevel.INFO;
};
