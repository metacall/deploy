import { ICommand } from '../../types/command.types';
import { CommandContext } from '../../types/CommandContext';
import { CommandResult } from '../../types/CommandResult';
import { ValidationError } from '../../errors/CLIError';

export abstract class BaseCommand implements ICommand {
	protected readonly logger = this.context.logger;
	protected readonly config = this.context.config;
	protected readonly interactive = this.context.interactive;

	constructor(protected readonly context: CommandContext) {}

	async run(): Promise<CommandResult> {
		this.validateContext();
		await this.preExecute();
		const result = await this.execute(this.context);
		await this.postExecute(result);
		return result;
	}

	abstract execute(context: CommandContext): Promise<CommandResult>;

	protected validateContext(): void {
		if (!this.config) {
			throw new ValidationError('Configuration is required');
		}
		if (!this.logger) {
			throw new ValidationError('Logger is required');
		}
	}

	protected async preExecute(): Promise<void> {
		// Default: no-op
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected async postExecute(_result: CommandResult): Promise<void> {
		// Default: no-op
	}
}
