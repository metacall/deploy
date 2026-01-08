import { CommandContext } from './CommandContext';
import { CommandResult } from './CommandResult';
import { ValidationResult } from './ValidationResult';

export interface ICommand {
	execute(context: CommandContext): Promise<CommandResult>;

	validate?(input: unknown): ValidationResult;

	canExecute?(context: CommandContext): boolean;
}
