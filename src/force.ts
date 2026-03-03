import { Deployment } from '@metacall/protocol/deployment';
import { API as APIInterface } from '@metacall/protocol/protocol';
import args from './cli/args';
import { error, info } from './cli/messages';
import { del } from './delete';

export const force = async (api: APIInterface): Promise<string> => {
	info('Trying to deploy forcefully!');

	const suffix = args['addrepo']
		? args['addrepo']?.split('com/')[1]?.split('/').join('-')
		: args['projectName']?.toLowerCase();

	if (!suffix) {
		info('No valid project identifier found. Proceeding normally.');
		return '';
	}

	let res = '';

	try {
		const repoSubscriptionDetails = (
			await api.listSubscriptionsDeploys()
		).filter(dep => dep.deploy === suffix);

		const repo: Deployment[] = (await api.inspect()).filter(
			dep => dep.suffix === suffix
		);

		if (repo.length > 0) {
			res = await del(
				repo[0].prefix,
				repo[0].suffix,
				repo[0].version,
				api
			);

			if (repoSubscriptionDetails.length > 0) {
				args['plan'] = repoSubscriptionDetails[0].plan;
			}

			info('Existing deployment removed successfully.');
		} else {
			info(
				'No existing deployment found. Proceeding with normal deployment.'
			);
		}
	} catch (e) {
		error(
			'Deployment Aborted because this directory is not being used by any applications.'
		);
	}

	return res;
};
