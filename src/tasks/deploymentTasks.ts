import { Listr } from 'listr2';
import { DeploymentConfig } from '../schemas/DeploymentSchema';
import { DeploymentService } from '../services/deployment/DeploymentService';

export function createDeploymentTasks(config: DeploymentConfig, service: DeploymentService): Listr {
	return new Listr(
		[
			{
				title: 'Validating project',
				task: async () => {
					await service.validateProject(config);
				}
			},
			{
				title: 'Generating package',
				task: async () => {
					await service.generatePackage(config);
				}
			},
			// Upload happens as part of deploy() method
			// {
			// 	title: 'Uploading package',
			// 	task: async () => {
			// 		// uploadPackage requires archive, additionalJsons, runners
			// 		// These are handled internally by deploy()
			// 	}
			// },
			{
				title: 'Deploying',
				task: async () => {
					await service.deploy(config);
				}
			},
			{
				title: 'Verifying deployment',
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				task: async (_ctx, _task) => {
					const result = (await service.deploy(config)) as {
						deploymentId: string;
					};
					const deploymentId = result.deploymentId || 'unknown';
					await service.verifyDeployment(deploymentId);
				}
			}
		],
		{
			concurrent: false,
			exitOnError: true
		}
	);
}
