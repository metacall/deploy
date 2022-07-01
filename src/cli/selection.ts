import { LanguageId } from '@metacall/protocol/deployment';
import {
	DisplayNameToLanguageId,
	Languages
} from '@metacall/protocol/language';
import { Plans } from '@metacall/protocol/plan';
import { prompt } from 'inquirer';

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

export const planSelection = (
	message: string,
	availablePlans: string[]
): Promise<Plans> =>
	prompt<{ plan: Plans }>([
		{
			type: 'list',
			name: 'plan',
			message,
			choices: availablePlans
		}
	]).then((res: { plan: Plans }) => res.plan);

export const listSelection = (
	list: string[],
	message: string
): Promise<string> =>
	prompt<{ container: string }>([
		{
			type: 'list',
			name: 'container',
			message,
			choices: list
		}
	]).then((res: { container: string }) => res.container);
