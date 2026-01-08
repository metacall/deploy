import { BaseCommand } from './base/BaseCommand';
import { CommandContext } from '../types/CommandContext';
import { CommandResult } from '../types/CommandResult';
import { readFileSync } from 'fs';
import { join } from 'path';

export class VersionCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	execute(_context: CommandContext): Promise<CommandResult> {
		return Promise.resolve(
			(() => {
				try {
					const packageJsonPath = join(__dirname, '../../package.json');
					const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
						version?: string;
					};
					const version = packageJson.version || 'unknown';

					return {
						exitCode: 0,
						message: `v${String(version)}`,
						data: { version: String(version) }
					};
				} catch (_error) {
					return {
						exitCode: 0,
						message: 'v2.0.0',
						data: { version: '2.0.0' }
					};
				}
			})()
		);
	}
}
