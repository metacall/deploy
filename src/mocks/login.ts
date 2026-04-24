import { ProtocolError } from '@metacall/protocol/protocol';

export default async function login(
	email: string,
	password: string
): Promise<string> {
	// simulate async
	await new Promise(resolve => setTimeout(resolve, 10));

	// ❌ missing credentials
	if (!email || !password) {
		const err = new Error(
			'Invalid authorization header, no credentials provided.'
		) as ProtocolError;
		err.data = 'Invalid authorization header, no credentials provided.';
		throw err;
	}

	// ❌ invalid email
	if (!email.includes('@')) {
		const err = new Error('Invalid email') as ProtocolError;
		err.data = 'Invalid email';
		throw err;
	}

	// ❌ invalid credentials (yeet@yeet.com / yeetyeet test case)
	if (email === 'yeet@yeet.com' && password === 'yeetyeet') {
		const err = new Error(
			'Invalid account email or password.'
		) as ProtocolError;
		err.data = 'Invalid account email or password.';
		throw err;
	}

	// ✅ success case → return token
	return `mock_token_${email}`;
}
