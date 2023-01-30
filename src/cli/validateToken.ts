import { API as APIInterface } from '@metacall/protocol/protocol';
import { save } from '../config';
import args from './args';
import { error, info } from './messages';

const handleValidateToken = async (api: APIInterface): Promise<void> => {
	const validToken = await api.validate();
	if (!validToken) {
		const token = await api.refresh();
		await save({ token });
	}
};

const validateToken = async (api: APIInterface): Promise<void> => {
	try {
		await handleValidateToken(api);
	} catch (err) {
		if (args['dev']) {
			info(
				'Please visit https://github.com/metacall/faas to learn how to set up FaaS locally.'
			);

			return error('FaaS is not serving locally.');
		}

		info('Try to login again!');

		return error(
			`Token validation failed, potential causes include:\n\t1) The JWT may be mistranslated (Invalid Signature).\n\t2) JWT might have expired.`
		);
	}
};

export default validateToken;
