import axios from 'axios';
import FormData from 'form-data';
import { zip } from './zip';

export const defaultBaseURL = 'https://dashboard.metacall.io';

export const refresh = (
	token: string,
	baseURL = defaultBaseURL
): Promise<string> =>
	axios
		.get<string>(baseURL + '/api/account/refresh-token', {
			headers: { Authorization: 'jwt ' + token }
		})
		.then(res => res.data);

export const validate = (
	token: string,
	baseURL = defaultBaseURL
): Promise<string> =>
	axios
		.get<string>(baseURL + '/validate', {
			headers: { Authorization: 'jwt ' + token }
		})
		.then(res => res.data);

type SubscriptionMap = Record<string, number>;

export const listSubscriptions = async (
	token: string,
	baseURL = defaultBaseURL
): Promise<SubscriptionMap> => {
	const res = await axios
		.get<string>(baseURL + '/api/billing/list-subscriptions', {
			headers: { Authorization: 'jwt ' + token }
		});

	const subscriptions: SubscriptionMap = {};

	for (const id of res.data) {
		if (subscriptions[id] === undefined) {
			subscriptions[id] = 1;
		} else {
			++subscriptions[id];
		}
	}

	return subscriptions;
};

export const upload = async (
	token: string,
	name: string,
	path = '.',
	baseURL = defaultBaseURL
): Promise<string> => {
	const fd = new FormData();
	fd.append('name', name);
	fd.append('type', 'application/x-zip-compressed');
	fd.append('runners', JSON.stringify([]));
	fd.append('jsons', JSON.stringify([]));
	fd.append('raw', zip(path), {
		filename: 'blob',
		contentType: 'application/x-zip-compressed'
	});
	const res = await axios.post<string>(baseURL + '/api/package/create', fd, {
		headers: { Authorization: 'jwt ' + token, ...fd.getHeaders() }
	});
	return res.data;
};

export const deploy = (
	token: string,
	name: string,
	version = 'v1',
	baseURL = defaultBaseURL
): Promise<string> =>
	axios
		.post<string>(
			baseURL + '/api/deploy/create',
			{
				resourceType: 'Package',
				suffix: name,
				version
			},
			{
				headers: { Authorization: 'jwt ' + token }
			}
		)
		.then(res => res.data);
