import { promises as fs } from 'fs';
import { parse, stringify } from 'ini';
import { join } from 'path';
import { ConfigurationError } from '../errors/CLIError';
import { CONFIG_DIR_NAME, CONFIG_FILE_NAME, DEFAULT_CONFIG } from '../constants/config.constants';
import { Config, ConfigSchema } from '../schemas/ConfigSchema';
import { configDir, ensureFolderExists, loadFile } from '../utils/fileUtils';

export class ConfigManager {
	private readonly defaultPath = configDir(CONFIG_DIR_NAME);

	private configFilePath(path = this.defaultPath): string {
		return join(path, CONFIG_FILE_NAME);
	}

	async load(path = this.defaultPath): Promise<Config> {
		try {
			const filePath = this.configFilePath(await ensureFolderExists(path));
			const data = parse(await loadFile(filePath));

			return ConfigSchema.parse({
				...DEFAULT_CONFIG,
				...data,
				...(data.renewTime ? { renewTime: Number(data.renewTime) } : {})
			});
		} catch (error) {
			if (error instanceof Error) {
				throw new ConfigurationError(`Failed to load config: ${error.message}`, error);
			}
			throw error;
		}
	}

	async save(data: Partial<Config>, path = this.defaultPath): Promise<void> {
		try {
			const currentConfig = await this.load(path).catch(() => DEFAULT_CONFIG);
			const mergedConfig = { ...currentConfig, ...data };

			const filteredConfig = this.filterConfig(DEFAULT_CONFIG, mergedConfig);

			const filePath = this.configFilePath(await ensureFolderExists(path));
			await fs.writeFile(filePath, stringify(filteredConfig));
		} catch (error) {
			if (error instanceof Error) {
				throw new ConfigurationError(`Failed to save config: ${error.message}`, error);
			}
			throw error;
		}
	}

	private filterConfig(defaults: Config, config: Partial<Config>): Record<string, unknown> {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(config)) {
			if (value !== undefined && value !== defaults[key as keyof Config]) {
				result[key] = value;
			}
		}
		return result;
	}
}
