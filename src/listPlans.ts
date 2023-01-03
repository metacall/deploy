import { API as APIInterface } from '@metacall/protocol/protocol';
import { info } from './cli/messages';
import { planFetch } from './plan';

export const listPlans = async (api: APIInterface): Promise<void> => {
	const availPlans = await planFetch(api);

	Object.keys(availPlans).forEach(el => {
		info(`${el} : ${availPlans[el]}`);
	});
};
