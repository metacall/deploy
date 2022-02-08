import { prompt } from 'inquirer';
import { LanguageId } from 'metacall-protocol/deployment';
import { DisplayNameToLanguageId, Languages } from 'metacall-protocol/language';
import { Plans } from 'metacall-protocol/plan';

export const loginSelection = (methods: string[]): Promise<string> =>
	prompt<{ method: string }>([
		{
			type: 'list',
			name: 'method',
			message: 'Select the login method',
			choices: methods
		}
	]).then((res: { method: string }) => res.method);

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

export const planSelection = (message: string): Promise<Plans> =>
	prompt<{ plan: Plans }>([
		{
			type: 'list',
			name: 'plan',
			message,
			choices: Object.keys(Plans)
		}
	]).then((res: { plan: Plans }) => res.plan);
