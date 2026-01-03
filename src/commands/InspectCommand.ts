import { BaseCommand } from './base/BaseCommand';
import { CommandContext } from '../types/CommandContext';
import { CommandResult } from '../types/CommandResult';
import { ProtocolClient } from '../services/protocol/ProtocolClient';
import { RetryPolicy } from '../services/RetryPolicy';

export class InspectCommand extends BaseCommand {
	async execute(context: CommandContext): Promise<CommandResult> {
		try {
			const client = new ProtocolClient(context.config.token || '', context.config.baseURL, new RetryPolicy());

			const deployments = await client.inspect();

			return {
				exitCode: 0,
				message: `Found ${deployments.length} deployment(s)`,
				data: deployments
			};
		} catch (error) {
			if (error instanceof Error) {
				return {
					exitCode: 1,
					message: `Failed to inspect deployments: ${error.message}`
				};
			}
			return {
				exitCode: 1,
				message: 'Failed to inspect deployments'
			};
		}
	}
}
