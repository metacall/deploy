import { Deployment } from 'metacall-protocol/deployment';
import API from 'metacall-protocol/protocol';
import { error } from './cli/messages';
import { del } from './delete';
import { startup } from './startup';

export const force = async (name: string): Promise<string> => {
	const config = await startup();
	const api = API(config.token as string, config.baseURL);

	let res = '';

	try {
		const repo: Deployment[] = (await api.inspect()).filter(
			dep => dep.suffix == name
		);

		if (repo) {
			res = await del(repo[0].prefix, repo[0].suffix, repo[0].version);
		}
	} catch (e) {
		error(String(e));
	}

	return res;
};
