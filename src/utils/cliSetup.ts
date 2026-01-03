import { Cli } from 'clipanion';
import { DeployCommand } from '../commands/clipanion/DeployCommand';
import { InspectCommand } from '../commands/clipanion/InspectCommand';
import { DeleteCommand } from '../commands/clipanion/DeleteCommand';
import { PlansCommand } from '../commands/clipanion/PlansCommand';
import { LogoutCommand } from '../commands/clipanion/LogoutCommand';
import { VersionCommand } from '../commands/clipanion/VersionCommand';
import { LoginCommand } from '../commands/clipanion/LoginCommand';
import { LogsCommand } from '../commands/clipanion/LogsCommand';
import { HelpCommand } from '../commands/clipanion/HelpCommand';

export function createCLI(): Cli {
	const cli = new Cli({
		binaryLabel: 'MetaCall Deploy CLI',
		binaryName: 'metacall-deploy',
		binaryVersion: '2.0.0'
	});

	cli.register(DeployCommand);
	cli.register(InspectCommand);
	cli.register(DeleteCommand);
	cli.register(PlansCommand);
	cli.register(LogoutCommand);
	cli.register(VersionCommand);
	cli.register(LoginCommand);
	cli.register(LogsCommand);
	cli.register(HelpCommand);

	return cli;
}

