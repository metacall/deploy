import { parse } from 'dotenv';
import { promises as fs } from 'fs';
import { join } from 'path';
import { exists } from './fileUtils';
import { confirm, inputText } from '../ui/prompts';
import { getLogger } from './logger';

const isInteractive = (): boolean => {
	return process.stdout.isTTY && !process.env.CI;
};

export async function getEnv(rootPath?: string): Promise<Array<{ name: string; value: string }>> {
	if (rootPath !== undefined) {
		const envFilePath = join(rootPath, '.env');

		if (await exists(envFilePath)) {
			try {
				const source = await fs.readFile(envFilePath, 'utf8');
				const parsedEnv = parse(source);
				getLogger().info('Detected and loaded environment variables from .env file.');
				return Object.entries(parsedEnv).map(([name, value]) => ({
					name,
					value: value || ''
				}));
			} catch (err) {
				getLogger().error(`Error while reading the .env file: ${(err as Error).toString()}`);
			}
		}
	}

	if (!isInteractive()) {
		return [];
	}

	const enableEnv = await confirm('Do you want to add environment variables?');

	if (!enableEnv) {
		return [];
	}

	const envInput = await inputText('Type env vars in the format: K1=V1, K2=V2');

	const env: Record<string, string> = {};

	if (envInput) {
		envInput.split(',').forEach(kv => {
			const trimmed = kv.trim();
			const [k, ...vParts] = trimmed.split('=');
			const v = vParts.join('='); // Handle values with = in them
			if (k && v) {
				env[k.trim()] = v.trim();
			}
		});
	}

	return Object.entries(env).map(([name, value]) => ({
		name,
		value
	}));
}
