import { Deployment, LogType } from '@metacall/protocol/deployment';
import { Command, Option } from 'clipanion';
import { IProtocolService } from '../../types/service.types';
import { selectContainer } from '../../ui/prompts';
import { RunnerToDisplayName } from '../../utils/languageUtils';
import { isInteractive } from '../../utils/ttyUtils';
import { BaseClipanionCommand } from './BaseClipanionCommand';

export class LogsCommand extends BaseClipanionCommand {
	static paths = [['logs']];

	static usage = Command.Usage({
		category: 'Monitoring',
		description: 'View deployment logs',
		details: `
			View logs for a specific deployment.
			You can view deploy logs or job logs for specific containers.
			In interactive mode, you can select the container from a list.
		`,
		examples: [
			['View deployment logs (interactive container selection)', 'metacall-deploy logs --id my-app-deploy-123'],
			['View logs for Node.js container', 'metacall-deploy logs --id my-app-deploy-123 --container node'],
			['View logs for Python container', 'metacall-deploy logs --id my-app-deploy-123 --container py'],
			['View job execution logs', 'metacall-deploy logs --id my-app-deploy-123 --type job'],
			['View deployment process logs', 'metacall-deploy logs --id my-app-deploy-123 --type deploy']
		]
	});

	id = Option.String('--id', {
		description: 'Deployment ID'
	});

	container = Option.String('--container', {
		description: 'Container name'
	});

	type = Option.String('--type', {
		description: 'Log type (deploy or job)'
	});

	dev = Option.Boolean('--dev', false, {
		description: 'Use development server'
	});

	async execute(): Promise<number> {
		const context = await this.buildContext();

		if (!this.id) {
			this.getLogger().error('Deployment ID is required');
			return 1;
		}

		try {
			const client = this.createProtocolService(context, this.dev);

			const deployments = await client.inspect();
			const deployment = deployments.find(d => d.suffix === this.id);

			if (!deployment) {
				this.getLogger().error(`Deployment ${this.id} not found`);
				return 1;
			}

			const prefix = deployment.prefix;
			const suffix = deployment.suffix;
			const version = deployment.version || 'v1';

			let container: string;
			if (this.container) {
				container = this.container;
			} else if (isInteractive()) {
				const runners: string[] = [];
				if (deployment.packages) {
					Object.keys(deployment.packages).forEach((lang: string) => {
						runners.push(lang);
					});
				}

				const containerChoices = [
					...runners.map(runner => ({
						name: RunnerToDisplayName(runner),
						value: runner
					})),
					{
						name: 'Deploy',
						value: 'deploy'
					}
				];

				container = await selectContainer(containerChoices, 'Select a container to get logs');
			} else {
				this.getLogger().error('Container is required in non-interactive mode');
				return 1;
			}

			const logType = this.type === 'job' ? LogType.Job : LogType.Deploy;

			await this.showLogs(client, container, suffix, prefix, version, logType);

			return 0;
		} catch (error) {
			if (error instanceof Error) {
				this.getLogger().error(`Failed to get logs: ${error.message}`);
			} else {
				this.getLogger().error('Failed to get logs');
			}
			return 1;
		}
	}

	private async showLogs(
		client: IProtocolService,
		container: string,
		suffix: string,
		prefix: string,
		version: string,
		type: LogType
	): Promise<void> {
		this.getLogger().info(`Getting ${type} logs for ${suffix}...`);

		let logsTill: string[] = [''];
		let status: Deployment['status'] = 'create';

		while (status !== 'ready') {
			const deployments = await client.inspect();
			const deployment = deployments.find(d => d.suffix === suffix);

			if (!deployment) {
				throw new Error(`Deployment ${suffix} not found`);
			}

			status = deployment.status;

			try {
				const allLogs = await client.logs(container, type, suffix, prefix, version);

				const logger = this.getLogger();
				allLogs.split('\n').forEach(line => {
					if (line && !logsTill.includes(line)) {
						logger.info(line);
					}
				});

				logsTill = allLogs.split('\n');
			} catch {
				// eslint-disable-next-line no-empty
			}

			if (status !== 'ready') {
				await new Promise(resolve => setTimeout(resolve, 10000));
			}
		}
	}
}
