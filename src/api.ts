import axios from 'axios';

export const defaultBaseURL = 'https://dashboard.metacall.io';

export const login = (email: string, password: string, baseURL = defaultBaseURL) =>
	axios.post(baseURL + '/login', { email, password })
		.then(res => res.data)
		.catch(() => null);

export const validate = (token: string, baseURL = defaultBaseURL) =>
	axios(baseURL + '/validate', {
		headers: { Authorization: 'jwt ' + token }
	})
		.then(res => res.data)
		.catch(() => false);
