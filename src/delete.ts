import { Deployment } from '@metacall/protocol/deployment';
import API, { ProtocolError } from '@metacall/protocol/protocol';
import args from './cli/args';
import { apiError, error, info } from './cli/messages';
import { listSelection } from './cli/selection';
import { startup } from './startup';

export const del = async (
	prefix: string,
	suffix: string,
	version: string
): Promise<string> => {
	const config = await startup(args['confDir']);
	const api = API(config.token as string, config.baseURL);

	let res = '';

	try {
		res = await api.deployDelete(prefix, suffix, version);
	} catch (err) {
		apiError(err as ProtocolError);
	}

	return res;
};

export const deleteBySelection = async (): Promise<void> => {
	const config = await startup(args['confDir']);
	const api = API(config.token as string, config.baseURL);

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

		info(await del(app.prefix, app.suffix, app.version));
	} catch (err) {
		error(String(err));
	}
};
