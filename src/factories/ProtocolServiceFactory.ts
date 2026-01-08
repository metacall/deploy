import { RetryPolicy } from '../services/RetryPolicy';
import { MockProtocolService } from '../services/protocol/MockProtocolService';
import { ProtocolClient } from '../services/protocol/ProtocolClient';
import { IProtocolService } from '../types/service.types';

export class ProtocolServiceFactory {
	static createProtocolService(
		token: string,
		baseURL: string,
		retryPolicy: RetryPolicy,
		mockMode: boolean
	): IProtocolService {
		if (mockMode) {
			const existing = MockProtocolService.getInstance();
			if (existing) {
				return existing;
			}
			return new MockProtocolService(token, baseURL, retryPolicy);
		}
		return new ProtocolClient(token, baseURL, retryPolicy);
	}
}

