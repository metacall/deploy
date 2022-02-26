import { Plans } from 'metacall-protocol/plan';
import { basename } from 'path';
import { parse } from 'ts-command-line-args';

const cliArgsDescription: { [k: string]: string } = {
	help: 'prints help.',
	addrepo: 'deploy from repository',
	workdir: 'accepts path to application directory.',
	projectName: 'accepts name of the application.',
	email: 'accepts email id for authentication.',
	password: 'accepts password for authentication.',
	token: 'accepts token for authentication, either pass email & password or token.',
	force: 'accepts boolean value : it deletes the deployment present on an existing plan and deploys again.',
	plan: 'accepts type of plan : "Essential", "Standard", "Premium".',
	inspect: 'lists out all the deployments with specifications'
};

interface CLIArgs {
	help?: boolean;
	addrepo?: string;
	workdir?: string;
	projectName: string;
	email?: string;
	password?: string;
	token?: string;
	force: boolean;
	plan?: Plans;
	confDir?: string;
	inspect?: boolean;
}

const parsePlan = (planType: string): Plans | undefined => {
	if (Object.keys(Plans).includes(planType)) {
		return Plans[planType as keyof typeof Plans];
	}
};

export default parse<CLIArgs>(
	{
		help: {
			type: Boolean,
			optional: true,
			alias: 'h',
			description: cliArgsDescription.help
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
		confDir: { type: String, alias: 'd', optional: true }
	},
	{
		helpArg: 'help',
		headerContentSections: [
			{
				header: 'Official CLI for metacall-deploy',
				content: 'Usage: metacall-deploy [--args]'
			}
		]
	}
);
