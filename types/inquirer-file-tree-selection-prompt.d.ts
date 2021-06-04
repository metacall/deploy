declare module 'inquirer-file-tree-selection-prompt' {
	import type * as inquirer from 'inquirer';

	class FileTreeSelectionPrompt implements inquirer.prompts.PromptBase {
		constructor(...args: unknown[]);

		moveActive(...args: unknown[]): void;

		onDownKey(...args: unknown[]): void;

		onEnd(...args: unknown[]): void;

		onError(...args: unknown[]): void;

		onSpaceKey(...args: unknown[]): void;

		onSubmit(...args: unknown[]): void;

		onUpKey(...args: unknown[]): void;

		prepareChildren(...args: unknown[]): void;

		render(...args: unknown[]): void;

		renderFileTree(...args: unknown[]): void;

		status: inquirer.prompts.PromptState;
		run(): Promise<unknown>;
	}

	export = FileTreeSelectionPrompt;
}
