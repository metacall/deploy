import { ICommand } from '../types/command.types';
import { CommandContext } from '../types/CommandContext';
import { UnknownCommandError } from '../errors/CLIError';
import { DeployCommand } from '../commands/DeployCommand';
import { InspectCommand } from '../commands/InspectCommand';
import { DeleteCommand } from '../commands/DeleteCommand';
import { PlansCommand } from '../commands/PlansCommand';
import { LogoutCommand } from '../commands/LogoutCommand';
import { VersionCommand } from '../commands/VersionCommand';
import { LoginCommand } from '../commands/LoginCommand';
import { PackageDeploymentStrategy } from '../strategies/PackageDeploymentStrategy';
import { RepositoryDeploymentStrategy } from '../strategies/RepositoryDeploymentStrategy';

export class CommandFactory {
	static create(commandName: string, args: Record<string, unknown>, context: CommandContext): ICommand {
		switch (commandName) {
			case 'deploy':
				return this.createDeployCommand(args, context);
			case 'inspect':
				return new InspectCommand(context);
			case 'delete':
				return new DeleteCommand(context);
			case 'plans':
				return new PlansCommand(context);
			case 'logout':
				return new LogoutCommand(context);
			case 'version':
				return new VersionCommand(context);
			case 'login':
				return new LoginCommand(context);
			default:
				throw new UnknownCommandError(commandName);
		}
	}

	private static createDeployCommand(args: Record<string, unknown>, context: CommandContext): ICommand {
		const strategy =
			args.repo && typeof args.repo === 'string'
				? new RepositoryDeploymentStrategy()
				: new PackageDeploymentStrategy();
		return new DeployCommand(context, strategy);
	}
}
