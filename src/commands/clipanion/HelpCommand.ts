import { Command, Option } from 'clipanion';
import { BaseClipanionCommand } from './BaseClipanionCommand';

export class HelpCommand extends BaseClipanionCommand {
	static paths = [['help'], ['--help'], ['-h']];

	static usage = Command.Usage({
		category: 'General',
		description: 'Display help information',
		details: `
			Display help information for the MetaCall Deploy CLI.
			You can get help for a specific command by running:
			\`metacall-deploy help --command <command>\`
			or
			\`metacall-deploy <command> --help\`
		`,
		examples: [
			['Show general help and command list', 'metacall-deploy help'],
			['Get help for specific command', 'metacall-deploy help --command deploy'],
			['View command help using --help flag', 'metacall-deploy deploy --help']
		]
	});

	command = Option.String('--command', {
		description: 'Command name to get help for'
	});

	execute(): Promise<number> {
		const logger = this.getLogger();

		if (this.command) {
			const commandName = this.command;
			logger.info(`Help for command: ${commandName}`);
			logger.info('');
			logger.info('Use the --help flag with the command for detailed information:');
			logger.info(`  metacall-deploy ${commandName} --help`);
			return Promise.resolve(0);
		}

		logger.info('MetaCall Deploy CLI - Deploy serverless functions to MetaCall FaaS');
		logger.info('');
		logger.info('Usage:');
		logger.info('  metacall-deploy <command> [options]');
		logger.info('');
		logger.info('Commands:');
		logger.info('  deploy      Deploy a package or repository to MetaCall FaaS');
		logger.info('  inspect     List all deployments');
		logger.info('  delete      Delete a deployment');
		logger.info('  plans       List available subscription plans');
		logger.info('  logs        View deployment logs');
		logger.info('  login       Authenticate with MetaCall');
		logger.info('  logout      Log out and clear authentication token');
		logger.info('  version     Display CLI version');
		logger.info('  help        Display this help message');
		logger.info('');
		logger.info('Global Options:');
		logger.info('  --confDir <path>     Custom configuration directory');
		logger.info('  --serverUrl <url>    Custom server URL');
		logger.info('  --verbose            Enable verbose logging');
		logger.info('  --mock               Use mock protocol service (no real API calls)');
		logger.info('  --help, -h           Show help');
		logger.info('  --version, -v        Show version');
		logger.info('');
		logger.info('Examples:');
		logger.info('  metacall-deploy deploy --workdir ./app --name my-app');
		logger.info('  metacall-deploy deploy --repo https://github.com/user/repo.git --name my-app');
		logger.info('  metacall-deploy inspect');
		logger.info('  metacall-deploy delete --id <deployment-id>');
		logger.info('  metacall-deploy plans');
		logger.info('');
		logger.info('For more information, visit: https://metacall.io');
		logger.info('For command-specific help, run: metacall-deploy <command> --help');

		return Promise.resolve(0);
	}
}

