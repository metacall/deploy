import * as p from '@clack/prompts';

export class Progress {
	static create(): {
		progress: (text: string, percentage: number) => void;
		pulse: (name: string) => void;
		hide: () => void;
	} {
		const spinner = p.spinner();

		return {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			progress: (text: string, _percentage: number) => {
				spinner.start(text);
			},
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			pulse: (_name: string) => {
				// No-op
			},
			hide: () => {
				spinner.stop();
			}
		};
	}
}
