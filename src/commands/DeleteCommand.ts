import { BaseCommand } from './base/BaseCommand';
import { CommandContext } from '../types/CommandContext';
import { CommandResult } from '../types/CommandResult';
import { ProtocolClient } from '../services/protocol/ProtocolClient';
import { RetryPolicy } from '../services/RetryPolicy';

export class DeleteCommand extends BaseCommand {
	async execute(context: CommandContext): Promise<CommandResult> {
		const deploymentId = 'placeholder';

		try {
			const client = new ProtocolClient(context.config.token || '', context.config.baseURL, new RetryPolicy());

			await client.delete(deploymentId);

			return {
				exitCode: 0,
				message: `Deployment ${deploymentId} deleted successfully`
			};
		} catch (error) {
			if (error instanceof Error) {
				return {
					exitCode: 1,
					message: `Failed to delete deployment: ${error.message}`
				};
			}
			return {
				exitCode: 1,
				message: 'Failed to delete deployment'
			};
		}
	}
}
