import { Plans } from '@metacall/protocol/plan';
import { basename } from 'path';
import { ArgumentConfig, parse, ParseOptions } from 'ts-command-line-args';

export enum InspectFormat {
	Invalid = 'Invalid',
	Table = 'Table',
	Raw = 'Raw',
	OpenAPIv3 = 'OpenAPIv3'
}

interface CLIArgs {
	version?: boolean;
	addrepo?: string;
	workdir: string;
	dev: boolean;
	projectName: string;
	email?: string;
	password?: string;
	token?: string;
	force: boolean;
	plan?: Plans;
	confDir?: string;
	inspect?: InspectFormat;
	delete?: boolean;
	serverUrl?: string;
	logout?: boolean;
	listPlans?: boolean;
	env?: string[];
	envFile?: string[];
	ignore?: string[];
	quiet?: boolean;
	verbose?: boolean;
	json?: boolean;
	dryRun?: boolean;
}

const parsePlan = (planType: string): Plans | undefined => {
	if (Object.keys(Plans).includes(planType)) {
		return Plans[planType as keyof typeof Plans];
	}
};

const parseInspectFormat = (inspectFormatType: string): InspectFormat => {
	if (inspectFormatType === '') {
		return InspectFormat.Table;
	}

	if (Object.keys(InspectFormat).includes(inspectFormatType)) {
		return InspectFormat[inspectFormatType as keyof typeof InspectFormat];
	}

	return InspectFormat.Invalid;
};

const optionsDefinition: ArgumentConfig<CLIArgs> = {
	version: {
		type: Boolean,
		optional: true,
		alias: 'v'
	},
	addrepo: {
		type: String,
		optional: true,
		alias: 'a'
	},
	workdir: {
		type: String,
		defaultValue: '',
		alias: 'w'
	},
	dev: {
		type: Boolean,
		defaultValue: false,
		alias: 'd'
	},
	projectName: {
		type: String,
		defaultValue: '',
		alias: 'n'
	},
	email: {
		type: String,
		alias: 'e',
		optional: true
	},
	password: {
		type: String,
		alias: 'p',
		optional: true
	},
	token: {
		type: String,
		alias: 't',
		optional: true
	},
	force: {
		type: Boolean,
		alias: 'f',
		defaultValue: false
	},
	plan: {
		type: parsePlan,
		alias: 'P',
		optional: true
	},
	inspect: {
		type: parseInspectFormat,
		alias: 'i',
		optional: true
	},
	delete: {
		type: Boolean,
		alias: 'D',
		defaultValue: false,
		optional: true
	},
	logout: {
		type: Boolean,
		alias: 'l',
		defaultValue: false,
		optional: true
	},
	listPlans: {
		type: Boolean,
		alias: 'r',
		defaultValue: false,
		optional: true
	},
	serverUrl: {
		type: String,
		alias: 'u',
		optional: true
	},
	confDir: { type: String, alias: 'c', optional: true },
	env: {
		type: String,
		alias: 'E',
		optional: true,
		multiple: true,
		description:
			'Set environment variable (can be used multiple times): -E KEY=VALUE'
	},
	envFile: {
		type: String,
		optional: true,
		multiple: true,
		description:
			'Path to .env file (can be used multiple times): --envFile .env.production'
	},
	ignore: {
		type: String,
		alias: 'I',
		optional: true,
		multiple: true,
		description:
			'Ignore pattern for files (can be used multiple times): -I "*.log" -I "node_modules"'
	},
	quiet: {
		type: Boolean,
		alias: 'q',
		defaultValue: false,
		optional: true,
		description: 'Suppress non-essential output'
	},
	verbose: {
		type: Boolean,
		alias: 'V',
		defaultValue: false,
		optional: true,
		description: 'Show detailed output for debugging'
	},
	json: {
		type: Boolean,
		defaultValue: false,
		optional: true,
		description: 'Output results in JSON format (useful for scripting)'
	},
	dryRun: {
		type: Boolean,
		defaultValue: false,
		optional: true,
		description: 'Show what would be deployed without actually deploying'
	}
};

const parseOptions: ParseOptions<CLIArgs> = {
	helpArg: 'help',
	headerContentSections: [
		{
			header: 'Official CLI for metacall-deploy',
			content: 'Usage: metacall-deploy [--args]'
		}
	],
	partial: true
};

const args = ((): CLIArgs & { _unknown: Array<string> } => {
	const parsedArgs = parse<CLIArgs>(optionsDefinition, parseOptions);

	// Adding this here because the CLI integration tests execute API
	// methods either from the child process (runCLI) to the parent
	// process, the one running mocha, so if we just add --dev in the child
	// it fails on the parent process, this is is also fine here because it
	// is executed only once at the startup of the program
	if (process.env.TEST_DEPLOY_LOCAL === 'true') {
		parsedArgs['dev'] = true;
	}

	// Initialize default working directory
	if (parsedArgs['workdir'] === '') {
		parsedArgs['workdir'] = process.cwd();
	}

	// Initialize default project name
	if (parsedArgs['projectName'] === '') {
		parsedArgs['projectName'] = basename(parsedArgs['workdir']);
	}

	return { _unknown: [], ...parsedArgs };
})();

export default args;
