import {
	Deployment,
	DeployStatus,
	LogType
} from 'metacall-protocol/deployment';
import API, { isProtocolError } from 'metacall-protocol/protocol';
import { error, info } from './cli/messages';
import { listSelection } from './cli/selection';
import { startup } from './startup';
import { sleep } from './utils';

const showLogs = async (
	container: string,
	suffix: string,
	type: LogType,
	dev: boolean
): Promise<void> => {
	const config = await startup();
	const api = API(
		config.token as string,
		dev ? config.devURL : config.baseURL
	);

	info(`Getting ${type} logs...`);

	let logsTill: string[] = [''];

	let app: Deployment;
	let status: DeployStatus = 'create';

	while (status !== 'ready') {
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
			if (isProtocolError(err)) continue;
		}

		await sleep(10000);
	}
};

export const logs = async (
	containers: string[],
	name: string,
	dev: boolean
) => {
	try {
		const container: string = await listSelection(
			[...containers, 'deploy'],
			'Select a container to get logs'
		);
		const type = container === 'deploy' ? LogType.Deploy : LogType.Job;

		await showLogs(container, name, type, dev);
	} catch (e) {
		error(String(e));
	}
};
