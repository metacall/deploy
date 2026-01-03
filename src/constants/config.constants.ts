import { Config } from '../schemas/ConfigSchema';

export const DEFAULT_CONFIG: Config = {
	baseURL: 'https://dashboard.metacall.io',
	apiURL: 'https://api.metacall.io',
	devURL: 'http://localhost:9000',
	renewTime: 1000 * 60 * 60 * 24 * 15 // 15 days
};

export const CONFIG_FILE_NAME = 'config.ini';

export const CONFIG_DIR_NAME = 'metacall';
