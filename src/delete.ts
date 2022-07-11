import { Deployment } from '@metacall/protocol/deployment';
import API, { ProtocolError } from '@metacall/protocol/protocol';
import { apiError, error, info } from './cli/messages';
import { listSelection } from './cli/selection';
import { Config } from './config';

const generateAPI = (config: Config) =>
	API(config.token as string, config.baseURL);

export const del = async (
	prefix: string,
	suffix: string,
	version: string,
	config: Config
): Promise<string> => {
	const api = generateAPI(config);

	let res = '';

	try {
		res = await api.deployDelete(prefix, suffix, version);
	} catch (err) {
		apiError(err as ProtocolError);
	}

	return res;
};

export const deleteBySelection = async (config: Config): Promise<void> => {
	const api = generateAPI(config);

	try {
		const deployments: Deployment[] = (await api.inspect()).filter(
			dep => dep.status === 'ready'
		);
		if (!deployments.length) error('No deployment found');

		const project: string = await listSelection(
			[...deployments.map(el => `${el.suffix} ${el.version}`)],
			'Select the deployment to delete:'
		);

		const app = deployments.filter(
			dep =>
				dep.suffix === project.split(' ')[0] &&
				dep.version === project.split(' ')[1]
		)[0];

		info(await del(app.prefix, app.suffix, app.version, config));
	} catch (err) {
		error(String(err));
	}
};
