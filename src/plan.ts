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

	let plan =
		args['plan'] && availPlans.includes(args['plan']) && args['plan'];

	plan =
		plan || availPlans.length === 1
			? (availPlans[0] as Plans)
			: await planSelection(
					'Please select plan from the list',
					availPlans
			  );

	return plan;
};
