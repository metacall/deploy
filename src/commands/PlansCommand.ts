import { BaseCommand } from './base/BaseCommand';
import { CommandContext } from '../types/CommandContext';
import { CommandResult } from '../types/CommandResult';
import { ProtocolClient } from '../services/protocol/ProtocolClient';
import { RetryPolicy } from '../services/RetryPolicy';

export class PlansCommand extends BaseCommand {
	async execute(context: CommandContext): Promise<CommandResult> {
		try {
			const client = new ProtocolClient(context.config.token || '', context.config.baseURL, new RetryPolicy());

			const plans = await client.listSubscriptions();
			const planKeys = Object.keys(plans);

			return {
				exitCode: 0,
				message: `Found ${planKeys.length} plan(s)`,
				data: plans
			};
		} catch (error) {
			if (error instanceof Error) {
				return {
					exitCode: 1,
					message: `Failed to list plans: ${error.message}`
				};
			}
			return {
				exitCode: 1,
				message: 'Failed to list plans'
			};
		}
	}
}
