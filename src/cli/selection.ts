import { prompt } from 'inquirer';
import { LanguageId } from '../lib/deployment';
import { DisplayNameToLanguageId, Languages } from '../lib/language';
import { Plans } from '../lib/plan';

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
	]).then(res => res.scripts);

export const languageSelection = (
	languages: LanguageId[] = []
): Promise<LanguageId[]> =>
	prompt<{ langs: string[] }>([
		{
			type: 'checkbox',
			name: 'langs',
			message: 'Select languages to run on Metacall',
			choices: languages.map(lang => Languages[lang].displayName)
		}
	]).then(res => res.langs.map(lang => DisplayNameToLanguageId[lang]));

export const planSelection = (message: string): Promise<Plans> =>
	prompt<{ plan: Plans }>([
		{
			type: 'checkbox',
			name: 'plan',
			message,
			choices: Object.keys(Plans)
		}
	]).then(res => res.plan);
