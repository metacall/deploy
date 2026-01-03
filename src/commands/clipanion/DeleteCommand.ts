import { Command, Option } from 'clipanion';
import { BaseClipanionCommand } from './BaseClipanionCommand';
import { selectDeployment } from '../../ui/prompts';
import { isInteractive } from '../../utils/ttyUtils';

export class DeleteCommand extends BaseClipanionCommand {
	static paths = [['delete']];

	static usage = Command.Usage({
		category: 'Management',
		description: 'Delete a deployment',
		details: `
			Delete a deployment by its ID.
			In interactive mode, you can select the deployment to delete from a list.
		`,
		examples: [
			['Delete a specific deployment by ID', 'metacall-deploy delete --id my-app-deploy-123'],
			['Select deployment to delete from list', 'metacall-deploy delete']
		]
	});

	id = Option.String('--id', {
		description: 'Deployment ID to delete'
	});

	async execute(): Promise<number> {
		const context = await this.buildContext();

		try {
			const client = this.createProtocolService(context);

			let prefix: string;
			let suffix: string;
			let version: string;

			if (this.id) {
				const deployments = await client.inspect();
				const deployment = deployments.find(d => d.suffix === this.id);
				if (!deployment) {
					this.getLogger().error(`Deployment ${this.id} not found`);
					return 1;
				}
				prefix = deployment.prefix;
				suffix = deployment.suffix;
				version = deployment.version || 'v1';
			} else {
				if (!isInteractive()) {
					this.getLogger().error('Deployment ID is required in non-interactive mode');
					return 1;
				}

				const deployments = await client.inspect();
				const readyDeployments = deployments
					.filter(dep => dep.status === 'ready')
					.map(dep => ({
						suffix: dep.suffix,
						version: dep.version || 'v1',
						prefix: dep.prefix
					}));

				if (readyDeployments.length === 0) {
					this.getLogger().error('No ready deployments found');
					return 1;
				}

				const selected = await selectDeployment(readyDeployments, 'Select the deployment to delete:');
				prefix = selected.prefix;
				suffix = selected.suffix;
				version = selected.version;
			}

			const result = await client.deployDelete(prefix, suffix, version);
			this.getLogger().info(result || `Deployment ${suffix} deleted successfully`);

			return 0;
		} catch (error) {
			if (error instanceof Error) {
				this.getLogger().error(`Failed to delete deployment: ${error.message}`);
			} else {
				this.getLogger().error('Failed to delete deployment');
			}
			return 1;
		}
	}
}
