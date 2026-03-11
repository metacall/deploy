import { Deployment } from '@metacall/protocol/deployment';
import { API as APIInterface } from '@metacall/protocol/protocol';
import args from './cli/args';
import { error, info } from './cli/messages';
import { del } from './delete';

export const force = async (api: APIInterface): Promise<string> => {
	info('Trying to deploy forcefully!');

	const suffix = args['addrepo']
		? args['addrepo']?.split('com/')[1].split('/').join('-')
		: args['projectName'].toLowerCase();

	let res = '';

	try {
		const repoSubscriptionDetails = (
			await api.listSubscriptionsDeploys()
		).filter(dep => dep.deploy === suffix);

		const repo: Deployment[] = (await api.inspect()).filter(
			dep => dep.suffix == suffix
		);

		if (repo.length > 0) {
			// An existing deployment was found — delete it before re-deploying.
			res = await del(
				repo[0].prefix,
				repo[0].suffix,
				repo[0].version,
				api
			);

			// Restore the plan from the subscription that owned this deployment
			// so the re-deploy is charged to the same subscription slot.
			if (repoSubscriptionDetails.length > 0) {
				args['plan'] = repoSubscriptionDetails[0].plan;
			}
		} else {
			// No prior deployment found skip deletion and proceed normally.
			info(
				'No existing deployment found for this project. Continuing as a fresh deploy.'
			);
		}
	} catch (e) {
		error(
			'Deployment Aborted due to an unexpected error while checking existing deployments.'
		);
	}

	return res;
};
