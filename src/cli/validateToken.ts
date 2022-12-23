import { API as APIInterface } from '@metacall/protocol/protocol';
import { save } from '../config';

export const validateToken = async (api: APIInterface): Promise<void> => {
	const validToken = await api.validate();
	if (!validToken) {
		const token = await api.refresh();

		await save({ token });
	}
};
