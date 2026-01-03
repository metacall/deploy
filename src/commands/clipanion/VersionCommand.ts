import { Command } from 'clipanion';
import { BaseClipanionCommand } from './BaseClipanionCommand';
import { readFileSync } from 'fs';
import { join } from 'path';

export class VersionCommand extends BaseClipanionCommand {
	static paths = [['version'], ['--version'], ['-v']];

	static usage = Command.Usage({
		category: 'General',
		description: 'Display CLI version',
		details: `
			Display the version of the MetaCall Deploy CLI.
		`,
		examples: [
			['Show version', 'metacall-deploy version'],
			['Show version (alternative)', 'metacall-deploy --version'],
			['Show version (short)', 'metacall-deploy -v']
		]
	});

	execute(): Promise<number> {
		return Promise.resolve(
			(() => {
				try {
					const packageJsonPath = join(__dirname, '../../../package.json');
					const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
						version?: string;
					};
					const version: string = packageJson.version || '2.0.0';

					this.getLogger().info(`v${version}`);

					return 0;
				} catch {
					this.getLogger().info('v2.0.0');
					return 0;
				}
			})()
		);
	}
}
