import {
	API as APIInterface,
	ProtocolError
} from '@metacall/protocol/protocol';
import { apiError, info } from './cli/messages';
import { planFetch } from './plan';

export const listPlans = async (api: APIInterface): Promise<void> => {
	try {
		const availPlans = await planFetch(api);

		Object.keys(availPlans).forEach(el => {
			info(`${el}: ${availPlans[el]}`);
		});
	} catch (err) {
		apiError(err as ProtocolError);
	}
};
