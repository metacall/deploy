import { info } from './cli/messages';
import { Config } from './config';
import { planFetch } from './plan';

export const listPlans = async (config: Config): Promise<void> => {
	const availPlans = await planFetch(config);

	Object.keys(availPlans).forEach(el => {
		info(`${el} : ${availPlans[el]}`);
	});
};
