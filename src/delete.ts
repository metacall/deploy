import { Deployment } from '@metacall/protocol/deployment';
import {
	API as APIInterface,
	ProtocolError
} from '@metacall/protocol/protocol';
import { apiError, error, info } from './cli/messages';
import { listSelection } from './cli/selection';

export const del = async (
	prefix: string,
	suffix: string,
	version: string,
	api: APIInterface
): Promise<string> => {
	let res = '';

	try {
		res = await api.deployDelete(prefix, suffix, version);
	} catch (err) {
		apiError(err as ProtocolError);
	}

	return res;
};

export const deleteBySelection = async (api: APIInterface): Promise<void> => {
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

		info(await del(app.prefix, app.suffix, app.version, api));
	} catch (err) {
		error(String(err));
	}
};

// This can be better
