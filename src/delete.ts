import { Deployment } from '@metacall/protocol/deployment';
import {
	API as APIInterface,
	ProtocolError,
	waitFor
} from '@metacall/protocol/protocol';
import { apiError, error, info } from './cli/messages';
import { listSelection } from './cli/selection';

export const deletedDeploy = async (
	suffix: string,
	api: APIInterface
): Promise<boolean> => {
	return await waitFor(async () => {
		const inspect = await api.inspect();

		const deployIdx = inspect.findIndex(deploy => deploy.suffix === suffix);

		if (deployIdx !== -1) {
			throw new Error('Not deleted yet');
		}

		return true;
	});
};

export const deleteDeploy = async (
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

	await deletedDeploy(suffix, api);

	return res;
};

export const deleteDeployBySelection = async (
	api: APIInterface
): Promise<void> => {
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

		info(await deleteDeploy(app.prefix, app.suffix, app.version, api));
	} catch (err) {
		error(String(err));
	}
};

// This can be better
