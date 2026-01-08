import { Command, Option } from 'clipanion';
import { CommandContext } from '../../types/CommandContext';
import { IProtocolService } from '../../types/service.types';
import { printTable } from '../../utils/inspectUtils';
import { rawInspectToOpenAPIv3 } from '../../utils/openapiGenerator';
import { BaseClipanionCommand } from './BaseClipanionCommand';

export class InspectCommand extends BaseClipanionCommand {
	static paths = [['inspect']];

	static usage = Command.Usage({
		category: 'Inspection',
		description: 'List all deployments',
		details: `
			Display information about all your deployments.
			You can view deployments in different formats: table (default), JSON, or OpenAPI v3.
		`,
		examples: [
			['List all deployments (default table view)', 'metacall-deploy inspect'],
			['Get deployments as JSON for scripting', 'metacall-deploy inspect --format json'],
			['Generate OpenAPI documentation', 'metacall-deploy inspect --format openapi'],
			['Monitor deployments in real-time', 'metacall-deploy inspect --watch'],
			['View development environment deployments', 'metacall-deploy inspect --dev']
		]
	});

	format = Option.String('--format', {
		description: 'Output format (table, json, openapi)'
	});

	watch = Option.Boolean('--watch', false, {
		description: 'Auto-refresh every 5 seconds'
	});

	dev = Option.Boolean('--dev', false, {
		description: 'Use development server'
	});

	async execute(): Promise<number> {
		const context = await this.buildContext();

		try {
			const client = this.createProtocolService(context, this.dev);

			const format = this.format || 'table';

			if (format === 'openapi' || format === 'openapi3') {
				await this.printOpenAPIv3(client, context);
			} else if (format === 'json' || format === 'raw') {
				await this.printRaw(client);
			} else {
				await this.printTable(client, context);
			}

			return 0;
		} catch (error) {
			if (error instanceof Error) {
				this.getLogger().error(`Failed to inspect deployments: ${error.message}`);
			} else {
				this.getLogger().error('Failed to inspect deployments');
			}
			return 1;
		}
	}

	private async printTable(client: IProtocolService, context: CommandContext): Promise<void> {
		const print = async () => {
			const deployments = await client.inspect();
			const apiURL = this.dev ? context.config.devURL : context.config.apiURL;
			printTable(deployments, apiURL, this.dev);
		};

		if (this.watch) {
			// eslint-disable-next-line no-constant-condition
			while (true) {
				console.clear();
				await print();
				await new Promise(resolve => setTimeout(resolve, 5000));
			}
		} else {
			await print();
		}
	}

	private async printRaw(client: IProtocolService): Promise<void> {
		const deployments = await client.inspect();
		this.getLogger().info(JSON.stringify(deployments, null, 2));
	}

	private async printOpenAPIv3(client: IProtocolService, context: CommandContext): Promise<void> {
		const deployments = await client.inspect();
		const apiURL = this.dev ? context.config.devURL : context.config.apiURL;
		const openapiDocs = rawInspectToOpenAPIv3(apiURL, deployments);
		this.getLogger().info(JSON.stringify(openapiDocs, null, 2));
	}
}
