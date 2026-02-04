import { Plans } from '@metacall/protocol/plan';
import { API as APIInterface } from '@metacall/protocol/protocol';
import args from './cli/args';
import { info, warn } from './cli/messages';
import { planSelection } from './cli/selection';
import { ErrorCode } from './deploy';

// TODO: We should cache the plan and ask for it only once

export const planFetch = async (
	api: APIInterface
): Promise<Record<string, number>> => {
	const availPlans: Record<string, number> = await api.listSubscriptions();

	if (!Object.keys(availPlans).length) {
		const deployedAppsCount = (await api.listSubscriptionsDeploys()).length;

		if (!deployedAppsCount) {
			info(
				'There are no active plans associated with your account. Please purchase a new plan at https://dashboard.metacall.io.'
			);
			return process.exit(ErrorCode.Ok);
		} else {
			info(
				'Every plan on your account has apps installed on it. A new plan can be purchased at https://dashboard.metacall.io.'
			);
			warn(
				'Use the --force flag when wiring the preceding command if you still wished to deploy.'
			);
			warn(
				"Be aware that the application will only be deployed using --force flag if the application's directory, and plan all match."
			);
			return process.exit(ErrorCode.Ok);
		}
	}

	return availPlans;
};

export const plan = async (api: APIInterface): Promise<Plans> => {
	const availPlans = Object.keys(await planFetch(api));

	// If user specified a plan via CLI and it's available, use it
	if (args['plan'] && availPlans.includes(args['plan'])) {
		return args['plan'];
	}

	// If only one plan is available, auto-select it
	if (availPlans.length === 1) {
		info(`Auto-selecting the only available plan: ${availPlans[0]}`);
		return availPlans[0] as Plans;
	}

	// Otherwise, prompt user to select from available plans
	return await planSelection('Please select plan from the list', availPlans);
};
