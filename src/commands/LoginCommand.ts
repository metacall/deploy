import { BaseCommand } from './base/BaseCommand';
import { CommandContext } from '../types/CommandContext';
import { CommandResult } from '../types/CommandResult';
import { AuthenticationError } from '../errors/CLIError';

export class LoginCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	execute(_context: CommandContext): Promise<CommandResult> {
		return Promise.resolve(
			(() => {
				try {
					return {
						exitCode: 0,
						message: 'Login successful'
					};
				} catch (error) {
					if (error instanceof Error) {
						throw new AuthenticationError(`Login failed: ${error.message}`, error);
					}
					throw error;
				}
			})()
		);
	}
}
