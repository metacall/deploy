export abstract class CLIError extends Error {
	abstract readonly exitCode: number;
	abstract readonly userMessage: string;

	constructor(message: string, public readonly cause?: Error) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends CLIError {
	readonly exitCode = 1;
	readonly userMessage = 'Validation failed';

	constructor(message: string, cause?: Error) {
		super(`Validation error: ${message}`, cause);
	}
}

export class DeploymentError extends CLIError {
	readonly exitCode = 2;
	readonly userMessage = 'Deployment failed';

	constructor(message: string, public readonly deploymentId?: string, cause?: Error) {
		super(`Deployment error: ${message}`, cause);
	}
}

export class AuthenticationError extends CLIError {
	readonly exitCode = 3;
	readonly userMessage = 'Authentication failed';

	constructor(message: string, cause?: Error) {
		super(`Authentication error: ${message}`, cause);
	}
}

export class NetworkError extends CLIError {
	readonly exitCode = 4;
	readonly userMessage = 'Network error';

	constructor(message: string, cause?: Error) {
		super(`Network error: ${message}`, cause);
	}
}

export class ConfigurationError extends CLIError {
	readonly exitCode = 5;
	readonly userMessage = 'Configuration error';

	constructor(message: string, cause?: Error) {
		super(`Configuration error: ${message}`, cause);
	}
}

export class UnknownCommandError extends CLIError {
	readonly exitCode = 127;
	readonly userMessage = 'Unknown command';

	constructor(commandName: string) {
		super(`Unknown command: ${commandName}`);
	}
}

export class DeploymentTimeoutError extends CLIError {
	readonly exitCode = 2;
	readonly userMessage = 'Deployment timed out';

	constructor(public readonly deploymentId: string, timeout: number) {
		super(`Deployment ${deploymentId} timed out after ${timeout}ms`);
	}
}

export class DeploymentFailedError extends CLIError {
	readonly exitCode = 2;
	readonly userMessage = 'Deployment failed';

	constructor(public readonly deploymentId: string, reason?: string) {
		super(`Deployment ${deploymentId} failed${reason ? `: ${reason}` : ''}`);
	}
}
