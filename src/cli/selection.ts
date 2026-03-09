import { LanguageId } from '@metacall/protocol/deployment';
import {
	DisplayNameToLanguageId,
	Languages
} from '@metacall/protocol/language';
import { Plans } from '@metacall/protocol/plan';
import { prompt } from 'inquirer';

const EXIT_OPTION = 'Exit';

const handleExit = (value: string): void => {
	if (value === EXIT_OPTION) {
		process.stdout.write('\nExiting...\n');
		process.exit(0);
	}
};

export const loginSelection = (methods: string[]): Promise<string> =>
	prompt<{ method: string }>([
		{
			type: 'list',
			name: 'method',
			message: 'Select the login method',
			choices: [...methods, EXIT_OPTION]
		}
	]).then((res: { method: string }) => {
		handleExit(res.method);
		return res.method;
	});

export const fileSelection = (
	message: string,
	files: string[] = []
): Promise<string[]> =>
	prompt<{ scripts: string[] }>([
		{
			type: 'checkbox',
			name: 'scripts',
			message,
			choices: files
		}
	]).then((res: { scripts: string[] }) => res.scripts);

export const languageSelection = (
	languages: LanguageId[] = []
): Promise<LanguageId[]> =>
	prompt<{ langs: string[] }>([
		{
			type: 'checkbox',
			name: 'langs',
			message: 'Select languages to run on MetaCall',
			choices: languages.map(lang => Languages[lang].displayName)
		}
	]).then((res: { langs: string[] }) =>
		res.langs.map(lang => DisplayNameToLanguageId[lang])
	);

export const planSelection = (
	message: string,
	availablePlans: string[]
): Promise<Plans> =>
	prompt<{ plan: Plans }>([
		{
			type: 'list',
			name: 'plan',
			message,
			choices: [...availablePlans, EXIT_OPTION]
		}
	]).then((res: { plan: Plans }) => {
		handleExit(res.plan as string);
		return res.plan;
	});

export const listSelection = (
	list: string[] | { name: string; value: string }[],
	message: string
): Promise<string> => {
	const choicesWithExit = [
		...list,
		{ name: EXIT_OPTION, value: EXIT_OPTION }
	];

	return prompt<{ container: string }>([
		{
			type: 'list',
			name: 'container',
			message,
			choices: choicesWithExit
		}
	]).then((res: { container: string }) => {
		handleExit(res.container);
		return res.container;
	});
};

export const consentSelection = (message: string): Promise<boolean> =>
	prompt<{ consent: boolean }>([
		{
			type: 'confirm',
			name: 'consent',
			message,
			default: false
		}
	]).then((res: { consent: boolean }) => res.consent);
