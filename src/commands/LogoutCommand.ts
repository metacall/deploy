import { ConfigManager } from '../config/ConfigManager';
import { CommandContext } from '../types/CommandContext';
import { CommandResult } from '../types/CommandResult';
import { BaseCommand } from './base/BaseCommand';

export class LogoutCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async execute(_context: CommandContext): Promise<CommandResult> {
		try {
			const configManager = new ConfigManager();
			await configManager.save({ token: undefined });

			return {
				exitCode: 0,
				message: 'Logged out successfully'
			};
		} catch (error) {
			if (error instanceof Error) {
				return {
					exitCode: 1,
					message: `Failed to logout: ${error.message}`
				};
			}
			return {
				exitCode: 1,
				message: 'Failed to logout'
			};
		}
	}
}
