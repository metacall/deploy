import { DEFAULT_BACKOFF_BASE_DELAY, DEFAULT_BACKOFF_MAX_DELAY, DEFAULT_MAX_RETRIES } from '../constants/app.constants';
import { BackoffStrategy } from '../types/service.types';

export class RetryPolicy {
	constructor(
		private readonly maxRetries: number = DEFAULT_MAX_RETRIES,
		private readonly backoff: BackoffStrategy = new ExponentialBackoff()
	) {}

	async execute<T>(fn: () => Promise<T>): Promise<T> {
		let lastError: Error | unknown;

		for (let attempt = 0; attempt < this.maxRetries; attempt++) {
			try {
				return await fn();
			} catch (error) {
				lastError = error;

				if (attempt === this.maxRetries - 1) {
					throw error;
				}

				await this.backoff.wait(attempt);
			}
		}

		throw lastError || new Error('Max retries exceeded');
	}
}

export class ExponentialBackoff implements BackoffStrategy {
	constructor(
		private readonly baseDelay: number = DEFAULT_BACKOFF_BASE_DELAY,
		private readonly maxDelay: number = DEFAULT_BACKOFF_MAX_DELAY
	) {}

	async wait(attempt: number): Promise<void> {
		const delay = Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay);
		await new Promise(resolve => setTimeout(resolve, delay));
	}
}
