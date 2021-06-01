import { LanguageId } from './deployment';

interface Language {
	tag: string; // Tag which corresponds to language_id in metacall.json
	displayName: string; // Name for displaying the language
	hexColor: string; // Color for displaying the language related things
	fileExtRegex: RegExp; // Regex for selecting the metacall.json scripts field
	runnerName?: string; // Id of the runner
	runnerFilesRegexes: RegExp[]; // Regex for generating the runners list
}

// TODO: Implement cob, rpc
export const Languages: Record<Exclude<LanguageId, 'cob' | 'rpc'>, Language> = {
	cs: {
		tag: 'cs',
		displayName: 'C#',
		hexColor: '#953dac',
		fileExtRegex: /^cs$/,
		runnerName: 'csharp',
		runnerFilesRegexes: [/^project\.json$/, /\.csproj$/]
	},
	py: {
		tag: 'py',
		displayName: 'Python',
		hexColor: '#ffd43b',
		fileExtRegex: /^py$/,
		runnerName: 'python',
		runnerFilesRegexes: [/^requirements\.txt$/]
	},
	rb: {
		tag: 'rb',
		displayName: 'Ruby',
		hexColor: '#e53935',
		fileExtRegex: /^rb$/,
		runnerName: 'ruby',
		runnerFilesRegexes: [/^Gemfile$/]
	},
	node: {
		tag: 'node',
		displayName: 'NodeJS',
		hexColor: '#3c873a',
		fileExtRegex: /^js$/,
		runnerName: 'nodejs',
		runnerFilesRegexes: [/^package\.json$/]
	},
	ts: {
		tag: 'ts',
		displayName: 'TypeScript',
		hexColor: '#007acc',
		fileExtRegex: /^(ts|tsx)$/,
		runnerName: 'nodejs',
		runnerFilesRegexes: [/^package\.json$/]
	},
	file: {
		tag: 'file',
		displayName: 'Static Files',
		hexColor: '#de5500',
		fileExtRegex: /^\w+$/,
		runnerName: undefined, // File has no runner (yet?)
		runnerFilesRegexes: [] // File has no runner files (yet?)
	}
};
