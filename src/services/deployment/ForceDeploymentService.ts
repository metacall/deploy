import { IProtocolService } from '../../types/service.types';
import { Plans } from '@metacall/protocol/plan';
import { DeploymentError } from '../../errors/CLIError';
import { getLogger } from '../../utils/logger';

export class ForceDeploymentService {
	constructor(private readonly protocolService: IProtocolService) {}

	async findExistingDeployment(suffix: string): Promise<{
		prefix: string;
		suffix: string;
		version: string;
		plan: Plans;
	} | null> {
		try {
			const deployments = await this.protocolService.inspect();
			const deployment = deployments.find(dep => dep.suffix === suffix);

			if (!deployment) {
				return null;
			}

			const subscriptionDeploys = await this.protocolService.listSubscriptionsDeploys();
			const subscriptionDeploy = subscriptionDeploys.find(dep => dep.deploy === suffix);

			if (!subscriptionDeploy) {
				return null;
			}

			return {
				prefix: deployment.prefix,
				suffix: deployment.suffix,
				version: deployment.version || 'v1',
				plan: subscriptionDeploy.plan
			};
		} catch (error) {
			if (error instanceof Error) {
				throw new DeploymentError(`Failed to find existing deployment: ${error.message}`, suffix, error);
			}
			throw error;
		}
	}

	async deleteExistingDeployment(prefix: string, suffix: string, version: string): Promise<string> {
		try {
			return await this.protocolService.deployDelete(prefix, suffix, version);
		} catch (error) {
			if (error instanceof Error) {
				throw new DeploymentError(`Failed to delete existing deployment: ${error.message}`, suffix, error);
			}
			throw error;
		}
	}

	async forceDeploy(suffix: string): Promise<Plans | null> {
		getLogger().info('Trying to deploy forcefully!');

		const existing = await this.findExistingDeployment(suffix);

		if (!existing) {
			getLogger().warn('Deployment Aborted because this directory is not being used by any applications.');
			return null;
		}

		await this.deleteExistingDeployment(existing.prefix, existing.suffix, existing.version);

		return existing.plan;
	}
}
