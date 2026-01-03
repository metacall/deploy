import { Config } from '../schemas/ConfigSchema';
import { Logger } from './logger.types';

export interface CommandContext {
	config: Config;
	logger: Logger;
	interactive: boolean;
	api?: unknown; // Protocol API client - will be typed properly later
}
