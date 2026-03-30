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

export const getAppendedLogLines = (
	previousLogs: string[],
	allLogs: string
): { appendedLogs: string[]; nextLogs: string[] } => {
	const normalizeLogLines = (lines: string[]): string[] => {
		if (lines[lines.length - 1] === '') {
			return lines.slice(0, -1);
		}

		return lines;
	};

	const normalizedPreviousLogs = normalizeLogLines(previousLogs);
	const nextLogs = normalizeLogLines(allLogs.split('\n'));

	// The API returns the full log snapshot on each poll. We track progress by
	// position so repeated messages are preserved as distinct log events.
	const hasSamePrefix = normalizedPreviousLogs.every(
		(line, index) => nextLogs[index] === line
	);

	if (
		nextLogs.length >= normalizedPreviousLogs.length &&
		normalizedPreviousLogs.length > 0 &&
		hasSamePrefix
	) {
		return {
			appendedLogs: nextLogs.slice(normalizedPreviousLogs.length),
			nextLogs
		};
	}

	if (normalizedPreviousLogs.length === 0) {
		return {
			appendedLogs: nextLogs,
			nextLogs
		};
	}

	// If the snapshot shrank or history was rewritten, replay the fresh snapshot.
	return {
		appendedLogs: nextLogs,
		nextLogs
	};
};

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

	while (status !== 'ready') {
		app = (await api.inspect()).filter(dep => dep.suffix === suffix)[0];

		status = app.status;
		const prefix = app.prefix;

		try {
			const allLogs = await api.logs(container, type, suffix, prefix);
			const { appendedLogs, nextLogs } = getAppendedLogLines(
				logsTill,
				allLogs
			);

			appendedLogs.forEach(line => {
				console.log(line);
			});

			logsTill = nextLogs;
		} catch (err) {
			if (isProtocolError(err)) continue;
		}

		await sleep(10000);
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
