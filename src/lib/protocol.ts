/*

* About File:

	this is just a client that implements all the rest API from the FaaS, so each function it contains is an endpoint in the FaaS for deploying and similar

	refresh: updates the auth token
	validate: validates the auth token
	deployEnabled: checks if you're able to deploy
	listSubscriptions: gives you a list of the subscription available
	inspect: gives you are deploys with it's endpoints
	upload: uploads a zip (package) into the faas
	deploy: deploys the previously uploaded zip into the faas
	deployDelete: deletes the deploy and the zip

*/

import axios from 'axios';
import FormData from 'form-data';
import { Deployment, MetaCallJSON } from './deployment';

type SubscriptionMap = Record<string, number>;

interface API {
	refresh(): Promise<string>;
	validate(): Promise<boolean>;
	deployEnabled(): Promise<boolean>;
	deployEnabled(): Promise<boolean>;
	listSubscriptions(): Promise<SubscriptionMap>;
	inspect(): Promise<Deployment[]>;
	upload(
		name: string,
		blob: unknown,
		jsons: MetaCallJSON[],
		runners: string[]
	): Promise<string>;
	deploy(
		name: string,
		env: string[],
		plan: string,
		release?: string,
		version?: string
	): Promise<string>;
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

		upload: async (
			name: string,
			blob: unknown,
			jsons: MetaCallJSON[] = [],
			runners: string[] = []
		): Promise<string> => {
			const fd = new FormData();
			fd.append('id', name);
			fd.append('type', 'application/x-zip-compressed');
			fd.append('jsons', JSON.stringify(jsons));
			fd.append('runners', JSON.stringify(runners));
			fd.append('raw', blob, {
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

		deploy: (
			name: string,
			env: string[],
			plan: string,
			release: string = Date.now().toString(16),
			version = 'v1'
		): Promise<string> =>
			axios
				.post<string>(
					baseURL + '/api/deploy/create',
					{
						resourceType: 'Package',
						suffix: name,
						release,
						env,
						plan,
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
