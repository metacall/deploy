import { ConfigManager } from '../../config/ConfigManager';
import { Command } from 'clipanion';
import { BaseClipanionCommand } from './BaseClipanionCommand';

export class LogoutCommand extends BaseClipanionCommand {
	static paths = [['logout']];

	static usage = Command.Usage({
		category: 'Authentication',
		description: 'Log out and clear authentication token',
		details: `
			Log out from MetaCall and clear the stored authentication token.
		`,
		examples: [
			['Log out', 'metacall-deploy logout']
		]
	});

	async execute(): Promise<number> {
		try {
			const configManager = new ConfigManager();
			const configPath = this.confDir ? this.confDir : undefined;

			const config = await configManager.load(configPath).catch(() => null);
			if (!config || !config.token) {
				this.getLogger().error("You haven't logged in yet! Kindly log in.");
				return 1;
			}

			await configManager.save({ token: undefined }, configPath);

			this.getLogger().info('You have logged out! See you later.');

			return 0;
		} catch (error) {
			if (error instanceof Error) {
				this.getLogger().error(`Failed to logout: ${error.message}`);
			} else {
				this.getLogger().error('Failed to logout');
			}
			return 1;
		}
	}
}
