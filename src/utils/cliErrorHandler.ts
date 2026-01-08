import { UsageError } from 'clipanion';
import { availableCommands, formatErrorMessage } from './commandSuggestions';

export function handleCLIError(error: unknown, args: string[]): void {
	if (error instanceof UsageError) {
		if (error.message.includes('Unknown command') || error.message.includes('Command not found')) {
			const message = formatErrorMessage(args);
			process.stderr.write(`${message}\n`);
			process.exit(127);
		}

		if (
			error.message.includes('Unknown option') ||
			error.message.includes('Invalid option') ||
			error.message.includes('Unsupported option')
		) {
			const command = args[0];
			let message = `Unknown option or flag.\n\n`;

			if (command && availableCommands.includes(command)) {
				message += `Run "metacall-deploy ${command} --help" to see available options for this command.`;
			} else {
				message += `Run "metacall-deploy help" to see available commands and options.`;
			}

			process.stderr.write(`${message}\n`);
			process.exit(1);
		}

		process.stderr.write(`Error: ${error.message}\n`);
		process.stderr.write(`Run "metacall-deploy help" for more information.\n`);
		process.exit(1);
	}

	throw error;
}

