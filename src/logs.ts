import { RunnerToDisplayName } from '@metacall/protocol';
import { Deployment, LogType } from '@metacall/protocol/deployment';
import API from '@metacall/protocol/protocol';
import args from './cli/args';
import { error, info, warn } from './cli/messages';
import { listSelection } from './cli/selection';
import { startup } from './startup';
import { isInteractive } from './tty';

const showLogs = async (
	container: string,
	suffix: string,
	type: LogType
): Promise<void> => {
	const config = await startup(args['confDir']);
	const api = API(
		config.token as string,
		args['dev'] ? config.devURL : config.baseURL
	);

	info(`Getting ${type} logs for ${suffix}...`);

	const deployments: Deployment[] = (await api.inspect()).filter(
		dep => dep.suffix === suffix
	);

	if (deployments.length === 0) {
		warn(`Deployment '${suffix}' not found`);
		return;
	}

	const deployment = deployments[0];

	const logs = await api.logs(container, type, deployment.prefix, suffix);

	console.log(logs);

	// TODO: Implement polling with waitFor
};

export const logJobs = async (containers: string[], suffix: string) => {
	try {
		const container = isInteractive()
			? await listSelection(
					containers.reduce(
						(choices, runner) => [
							...choices,
							{
								name: RunnerToDisplayName(runner),
								value: runner
							}
						],
						[
							{
								name: 'Deploy',
								value: 'deploy'
							}
						]
					),
					'Select a container to get logs'
			  )
			: 'deploy';

		const type = container === 'deploy' ? LogType.Deploy : LogType.Job;

		await showLogs(container, suffix, type);
	} catch (e) {
		error(String(e));
	}
};

export const logs = async () => {
	const config = await startup(args['confDir']);
	const api = API(
		config.token as string,
		args['dev'] ? config.devURL : config.baseURL
	);

	const deployments: Deployment[] = await api.inspect();
	if (!deployments.length) error('No deployment found');

	const suffix: string = await listSelection(
		[...deployments.map(deploy => `${deploy.suffix} ${deploy.version}`)],
		'Select the deployment to get the logs:'
	);

	const jobs = await api.availableJobLogs(suffix);

	return await logJobs(jobs, suffix);
};
