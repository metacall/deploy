import {
	Deployment,
	DeployStatus,
	LogType
} from '@metacall/protocol/deployment';
import { RunnerToDisplayName } from '@metacall/protocol/language';
import API, { isProtocolError } from '@metacall/protocol/protocol';
import args from './cli/args';
import { error, info } from './cli/messages';
import { listSelection } from './cli/selection';
import { startup } from './startup';
import { sleep } from './utils';

// Terminal states where polling should stop
// Using string[] because runtime status values may not align with TypeScript types
const TERMINAL_STATES: string[] = ['ready', 'error', 'fail'];

// Maximum polling attempts to prevent infinite loops (360 * 10s = 1 hour)
const MAX_POLL_ATTEMPTS = 360;

const showLogs = async (
	container: string,
	suffix: string,
	type: LogType,
	dev: boolean
): Promise<void> => {
	const config = await startup(args['confDir']);
	const api = API(
		config.token as string,
		dev ? config.devURL : config.baseURL
	);

	info(`Getting ${type} logs for ${suffix}...`);

	let logsTill: string[] = [''];

	let app: Deployment;
	let status: DeployStatus = 'create';
	let pollAttempts = 0;

	while (
		!TERMINAL_STATES.includes(status) &&
		pollAttempts < MAX_POLL_ATTEMPTS
	) {
		app = (await api.inspect()).filter(dep => dep.suffix === suffix)[0];

		status = app.status;
		const prefix = app.prefix;

		try {
			const allLogs = await api.logs(container, type, suffix, prefix);

			allLogs.split('\n').forEach(el => {
				if (!logsTill.includes(el)) console.log(el);
			});

			logsTill = allLogs.split('\n');
		} catch (err) {
			if (isProtocolError(err)) {
				pollAttempts++;
				await sleep(10000);
				continue;
			}
		}

		pollAttempts++;
		await sleep(10000);
	}

	// Handle terminal states
	if (status === ('error' as DeployStatus)) {
		error('Deployment failed with error status. Check logs above.');
		process.exit(1);
	}

	if (status === ('fail' as DeployStatus)) {
		error('Deployment failed. Check logs above.');
		process.exit(1);
	}

	if (pollAttempts >= MAX_POLL_ATTEMPTS) {
		error('Polling timeout: maximum polling attempts exceeded.');
		process.exit(1);
	}
};

export const logs = async (
	containers: string[],
	suffix: string,
	dev: boolean
) => {
	try {
		const container: string = await listSelection(
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
		);
		const type = container === 'deploy' ? LogType.Deploy : LogType.Job;

		await showLogs(container, suffix, type, dev);
	} catch (e) {
		error(String(e));
	}
};
