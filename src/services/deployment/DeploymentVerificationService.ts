import { DeploymentFailedError, DeploymentTimeoutError } from '../../errors/CLIError';
import { DeploymentResult } from '../../types/DeploymentResult';
import { IProtocolService } from '../../types/service.types';

export class DeploymentVerificationService {
	constructor(private readonly protocolService: IProtocolService) {}

	async verify(deploymentId: string, timeout = 300000): Promise<DeploymentResult> {
		const startTime = Date.now();
		const pollInterval = 2000;

		while (Date.now() - startTime < timeout) {
			const deployment = await this.protocolService.inspectById(deploymentId);
			const status = deployment.status || 'pending';

			if (status === 'ready') {
				return {
					deploymentId,
					name: deployment.suffix || deploymentId,
					status: 'ready',
					data: deployment
				};
			}

			if (status === 'fail') {
				throw new DeploymentFailedError(deploymentId, undefined);
			}

			await this.sleep(pollInterval);
		}

		throw new DeploymentTimeoutError(deploymentId, timeout);
	}

	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}
