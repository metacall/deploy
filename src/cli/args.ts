import { Plans } from '@metacall/protocol/plan';
import { basename } from 'path';
import { ArgumentConfig, parse, ParseOptions } from 'ts-command-line-args';

const cliArgsDescription: { [k: string]: string } = {
	help: 'Prints a user manual to assist you in using the cli.',
	version: 'Prints current version of the cli.',
	addrepo: 'Deploy from repository.',
	workdir: 'Accepts path to application directory.',
	dev: 'Run CLI in dev mode (deploy locally to metacall/faas).',
	projectName: 'Accepts name of the application.',
	email: 'Accepts email id for authentication.',
	password: 'Accepts password for authentication.',
	token: 'Accepts token for authentication, either pass email & password or token.',
	force: 'Accepts boolean value: it deletes the deployment present on an existing plan and deploys again.',
	plan: 'Accepts type of plan: "Essential", "Standard", "Premium".',
	inspect: 'Lists out all the deployments with specifications.',
	delete: 'Accepts boolean value: it provides you all the available deployment options to delete.',
	logout: 'Accepts boolean value: use it inorder to logged out.'
};

interface CLIArgs {
	help?: boolean;
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
}

const parsePlan = (planType: string): Plans | undefined => {
	if (Object.keys(Plans).includes(planType)) {
		return Plans[planType as keyof typeof Plans];
	}
};

const optionsDefinition: ArgumentConfig<CLIArgs> = {
	help: {
		type: Boolean,
		optional: true,
		alias: 'h',
		description: cliArgsDescription.help
	},
	version: {
		type: Boolean,
		optional: true,
		alias: 'v',
		description: cliArgsDescription.version
	},
	addrepo: {
		type: String,
		optional: true,
		alias: 'a',
		description: cliArgsDescription.addrepo
	},
	workdir: {
		type: String,
		optional: true,
		alias: 'w',
		defaultValue: process.cwd(),
		description: cliArgsDescription.workdir
	},
	dev: {
		type: Boolean,
		defaultValue: false,
		description: cliArgsDescription.dev
	},
	projectName: {
		type: String,
		alias: 'n',
		defaultValue: basename(process.cwd()),
		description: cliArgsDescription.projectName
	},
	email: {
		type: String,
		alias: 'e',
		optional: true,
		description: cliArgsDescription.email
	},
	password: {
		type: String,
		alias: 'p',
		optional: true,
		description: cliArgsDescription.password
	},
	token: {
		type: String,
		alias: 't',
		optional: true,
		description: cliArgsDescription.token
	},
	force: {
		type: Boolean,
		alias: 'f',
		defaultValue: false,
		description: cliArgsDescription.force
	},
	plan: {
		type: parsePlan,
		alias: 'P',
		optional: true,
		description: cliArgsDescription.plan
	},
	inspect: {
		type: Boolean,
		alias: 'i',
		defaultValue: false,
		optional: true,
		description: cliArgsDescription.inspect
	},
	delete: {
		type: Boolean,
		alias: 'D',
		defaultValue: false,
		optional: true,
		description: cliArgsDescription.delete
	},
	logout: {
		type: Boolean,
		alias: 'l',
		defaultValue: false,
		optional: true,
		description: cliArgsDescription.logout
	},
	serverUrl: {
		type: String,
		alias: 'u',
		optional: true
	},
	confDir: { type: String, alias: 'd', optional: true }
};

const parseOptions: ParseOptions<CLIArgs> = {
	helpArg: 'help',
	headerContentSections: [
		{
			header: 'Official CLI for metacall-deploy',
			content: 'Usage: metacall-deploy [--args]'
		}
	]
};

const parsingOptions = (): ParseOptions<CLIArgs> => {
	const MochaVarsArray = [
		'afterEach',
		'after',
		'beforeEach',
		'before',
		'describe',
		'it'
	] as const;

	type MochaVars = typeof MochaVarsArray[number];

	// Prevents UNKNOWN_OPTION exception #45 (https://github.com/75lb/command-line-args/wiki/Mocha-test-script-example)

	return MochaVarsArray.every(
		(f: string): boolean => global[f as MochaVars] instanceof Function
	)
		? { ...parseOptions, partial: true }
		: parseOptions;
};

export default parse<CLIArgs>(optionsDefinition, parsingOptions());
