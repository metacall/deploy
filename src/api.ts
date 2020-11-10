import axios from 'axios';

export const defaultBaseURL = 'https://dashboard.metacall.io';

export const login = (
	email: string,
	password: string,
	baseURL = defaultBaseURL
) => axios.post(baseURL + '/login', { email, password }).then(res => res.data);

export const validate = (token: string, baseURL = defaultBaseURL) =>
	axios(baseURL + '/validate', {
		headers: { Authorization: 'jwt ' + token }
	}).then(res => res.data);

export const signup = (
	email: string,
	password: string,
	baseURL = defaultBaseURL
) => axios.post(baseURL + '/signup', { email, password }).then(res => res.data);

export const upload = (
	token: string,
	name: string,
	data: Buffer,
	baseURL = defaultBaseURL
) =>
	axios
		.post(
			baseURL + '/api/load/package',
			{
				id: name,
				raw: data.toJSON().data,
				type: 'application/zip'
			},
			{
				headers: { Authorization: 'jwt ' + token }
			}
		)
		.then(res => res.data);

export const deploy = (
	token: string,
	name: string,
	version = 'v1',
	baseURL = defaultBaseURL
) =>
	axios
		.post(
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
