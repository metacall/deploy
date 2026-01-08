import { DeploymentConfig } from '../schemas/DeploymentSchema';
import { DeploymentResult } from '../types/DeploymentResult';
import { IProtocolService } from '../types/service.types';
import { IDeploymentStrategy } from '../types/strategy.types';

export class DeploymentContext {
	constructor(
		private readonly strategy: IDeploymentStrategy,
		private readonly config: DeploymentConfig,
		private readonly api?: IProtocolService
	) {}

	async deploy(): Promise<DeploymentResult> {
		const validation = await this.strategy.validate(this);
		if (!validation.valid) {
			const errorMessage = validation.errors?.join(', ') || 'Unknown validation error';
			throw new Error(`Validation failed: ${errorMessage}`);
		}

		await this.strategy.prepare(this);
		return await this.strategy.deploy(this);
	}

	getConfig(): DeploymentConfig {
		return this.config;
	}

	getApiClient(): IProtocolService {
		if (!this.api) {
			throw new Error('API client not available in context');
		}
		return this.api;
	}
}
