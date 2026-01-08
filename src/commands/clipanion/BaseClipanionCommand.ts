import { Command, Option } from 'clipanion';
import { ConfigManager } from '../../config/ConfigManager';
import { DEFAULT_CONFIG } from '../../constants/config.constants';
import { LogLevel } from '../../constants/logging.constants';
import { ProtocolServiceFactory } from '../../factories/ProtocolServiceFactory';
import { RetryPolicy } from '../../services/RetryPolicy';
import { CommandContext } from '../../types/CommandContext';
import { IProtocolService } from '../../types/service.types';
import { Logger } from '../../types/logger.types';
import { createLoggerInterface } from '../../utils/logger';

export abstract class BaseClipanionCommand extends Command {
	confDir = Option.String('--confDir', {
		description: 'Custom configuration directory'
	});

	serverUrl = Option.String('--serverUrl', {
		description: 'Custom server URL'
	});

	verbose = Option.Boolean('--verbose', false, {
		description: 'Enable verbose logging'
	});

	mock = Option.Boolean('--mock', false, {
		description: 'Use mock protocol service (no real API calls)'
	});

	protected async buildContext(): Promise<CommandContext> {
		const configManager = new ConfigManager();
		const configPath = this.confDir ? this.confDir : undefined;
		const config = await configManager.load(configPath).catch(() => DEFAULT_CONFIG);

		if (this.serverUrl) {
			config.baseURL = this.serverUrl;
		}

		return {
			config,
			logger: this.getLogger(),
			interactive: this.isInteractive()
		};
	}

	protected isInteractive(): boolean {
		return process.stdout.isTTY && !process.env.CI;
	}

	protected getLogger(): Logger {
		return createLoggerInterface({
			level: this.verbose || process.env.DEBUG ? LogLevel.DEBUG : LogLevel.INFO,
			color: this.isInteractive()
		});
	}

	protected createProtocolService(context: CommandContext, dev = false): IProtocolService {
		const token = process.env.METACALL_API_KEY || context.config.token || '';
		const baseURL = dev ? context.config.devURL : context.config.baseURL;
		const retryPolicy = new RetryPolicy();

		const mockMode = this.mock || process.env.METACALL_MOCK_MODE === 'true';

		return ProtocolServiceFactory.createProtocolService(token, baseURL, retryPolicy, mockMode);
	}
}
