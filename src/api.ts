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
/*
axios.post(baseURL + '/login', {
	email: 'trgwii@hotmail.com',
	password: 'gonnagetyou'
})
	.then(res => res.data)
	.then(token => {
		axios(baseURL + '/validate', {
			headers: {
				Authorization: 'jwt ' + 'f' + token.slice(1),
				Cookie: 'AccessToken=' + token + '; Email=trgwii@hotmail.com'
			}
		})
			.then(res => res.data)
			.then(console.log);
	});
*/
