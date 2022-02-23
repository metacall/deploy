import axios from 'axios';
import { Deployment, LogType } from 'metacall-protocol/deployment';
import API from 'metacall-protocol/protocol';
import { info } from '../cli/messages';
import { startup } from '../startup';
import { sleep } from '../utils';

type DeployStatus = 'create' | 'ready' | 'fail';

export const logs = async (
	container: string,
	suffix: string,
	type: LogType
): Promise<void> => {
	const config = await startup();
	const api = API(config.token as string, config.baseURL);

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
			if (axios.isAxiosError(err)) continue;
		}

		await sleep(10000);
	}
};
