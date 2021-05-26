import axios from 'axios';
import FormData from 'form-data';
import { Deployment } from './inspect';
import { zip } from './zip';

type SubscriptionMap = Record<string, number>;

interface API {
	refresh(): Promise<string>;
	validate(): Promise<boolean>;
	deployEnabled(): Promise<boolean>;
	deployEnabled(): Promise<boolean>;
	listSubscriptions(): Promise<SubscriptionMap>;
	inspect(): Promise<Deployment[]>;
	upload(name: string, path: string): Promise<string>;
	deploy(name: string, version: string): Promise<string>;
	deployDelete(
		prefix: string,
		suffix: string,
		version: string
	): Promise<string>;
}

export default (token: string, baseURL: string): API => {
	const api: API = {
		refresh: (): Promise<string> =>
			axios
				.get<string>(baseURL + '/api/account/refresh-token', {
					headers: { Authorization: 'jwt ' + token }
				})
				.then(res => res.data),

		validate: (): Promise<boolean> =>
			axios
				.get<boolean>(baseURL + '/validate', {
					headers: { Authorization: 'jwt ' + token }
				})
				.then(res => res.data),

		deployEnabled: (): Promise<boolean> =>
			axios
				.get<boolean>(baseURL + '/api/account/deploy-enabled', {
					headers: { Authorization: 'jwt ' + token }
				})
				.then(res => res.data),

		listSubscriptions: async (): Promise<SubscriptionMap> => {
			const res = await axios.get<string[]>(
				baseURL + '/api/billing/list-subscriptions',
				{
					headers: { Authorization: 'jwt ' + token }
				}
			);

			const subscriptions: SubscriptionMap = {};

			for (const id of res.data) {
				if (subscriptions[id] === undefined) {
					subscriptions[id] = 1;
				} else {
					++subscriptions[id];
				}
			}

			return subscriptions;
		},

		inspect: async (): Promise<Deployment[]> =>
			axios
				.get<Deployment[]>(baseURL + '/api/inspect', {
					headers: { Authorization: 'jwt ' + token }
				})
				.then(res => res.data),

		upload: async (name: string, path = process.cwd()): Promise<string> => {
			const fd = new FormData();
			fd.append('name', name);
			fd.append('type', 'application/x-zip-compressed');
			fd.append('runners', JSON.stringify([])); // TODO
			fd.append('jsons', JSON.stringify([])); // TODO
			fd.append('raw', zip(path), {
				filename: 'blob',
				contentType: 'application/x-zip-compressed'
			});
			const res = await axios.post<string>(
				baseURL + '/api/package/create',
				fd,
				{
					headers: {
						Authorization: 'jwt ' + token,
						...fd.getHeaders()
					}
				}
			);
			return res.data;
		},

		deploy: (name: string, version = 'v1'): Promise<string> =>
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
				.then(res => res.data),

		deployDelete: (
			prefix: string,
			suffix: string,
			version = 'v1'
		): Promise<string> =>
			axios
				.post<string>(
					baseURL + '/api/deploy/delete',
					{
						prefix,
						suffix,
						version
					},
					{
						headers: { Authorization: 'jwt ' + token }
					}
				)
				.then(res => res.data)
	};

	return api;
};
