import axios from 'axios';

export const defaultBaseURL = 'https://dashboard.metacall.io';

export const login = (email: string, password: string, baseURL = defaultBaseURL) =>
	axios.post(baseURL + '/login', { email, password })
		.then(res => res.data);

export const validate = (token: string, baseURL = defaultBaseURL) =>
	axios(baseURL + '/validate', {
		headers: { Authorization: 'jwt ' + token }
	}).then(res => res.data);

export const signup = (email: string, password: string, baseURL = defaultBaseURL) =>
	axios.post(baseURL + '/signup', { email, password })
		.then(res => res.data);

export const upload = (token: string, data: Buffer, baseURL = defaultBaseURL) =>
	axios.post(baseURL + '/api/load/package', {
		id: 'poop',
		raw: data.toJSON().data,
		type: 'application/zip'
	}, {
		headers: { Authorization: 'jwt ' + token }
	}).then(res => res.data);
