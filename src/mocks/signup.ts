import { ProtocolError } from '@metacall/protocol/protocol';

// Pre-configured taken emails and aliases for mock testing
const takenEmails = ['noot@noot.com', 'taken@example.com'];
const takenAliases = ['creatoon', 'admin', 'root', 'test'];

export default async function signup(
	email: string,
	password: string,
	alias: string
): Promise<string> {
	// simulate async
	console.log('[MOCK SIGNUP] Called with email:', email, 'alias:', alias);
	await new Promise(resolve => setTimeout(resolve, 10));

	// missing credentials
	if (!email || !password || !alias) {
		const err = new Error('Missing required fields') as ProtocolError;
		err.data = 'Missing required fields';
		throw err;
	}

	// invalid email
	if (!email.includes('@')) {
		const err = new Error('Invalid email') as ProtocolError;
		err.data = 'Invalid email';
		throw err;
	}

	// email already taken
	if (takenEmails.includes(email)) {
		const err = new Error('Email is already taken') as ProtocolError;
		err.data = 'Email is already taken';
		throw err;
	}

	// alias already taken
	if (takenAliases.includes(alias)) {
		const err = new Error('alias is already taken') as ProtocolError;
		err.data = 'alias is already taken';
		throw err;
	}

	// password too short
	if (password.length < 3) {
		const err = new Error(
			'Password must be at least 3 characters'
		) as ProtocolError;
		err.data = 'Password must be at least 3 characters';
		throw err;
	}

	// success case
	console.log('[MOCK SIGNUP] Signup successful for:', email);
	return 'A verification email has been sent to your email address. Please verify your email to complete the signup process.';
}
