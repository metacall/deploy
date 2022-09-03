import { Plans } from '@metacall/protocol/plan';
import { basename } from 'path';
import { ArgumentConfig, parse, ParseOptions } from 'ts-command-line-args';

interface CLIArgs {
	version?: boolean;
	addrepo?: string;
	workdir?: string;
	dev: boolean;
	projectName: string;
	email?: string;
	password?: string;
	token?: string;
	force: boolean;
	plan?: Plans;
	confDir?: string;
	inspect?: boolean;
	delete?: boolean;
	serverUrl?: string;
	logout?: boolean;
	listPlans?: boolean;
}

interface optionDefinition {
	type: BooleanConstructor | StringConstructor;
	optional?: true;
	alias: String;
	defaultValue: boolean | string;
}

const parsePlan = (planType: string): Plans | undefined => {
	if (Object.keys(Plans).includes(planType)) {
		return Plans[planType as keyof typeof Plans];
	}
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
		optional: true,
		alias: 'w',
		defaultValue: process.cwd()
	},
	dev: {
		type: Boolean,
		defaultValue: false,
		alias: 'd'
	},
	projectName: {
		type: String,
		alias: 'n',
		defaultValue: basename(process.cwd())
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
		type: Boolean,
		alias: 'i',
		defaultValue: false,
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
	confDir: { type: String, alias: 'c', optional: true }
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

const args = parse<CLIArgs>(optionsDefinition, parseOptions);

export default { _unknown: [], ...args };
