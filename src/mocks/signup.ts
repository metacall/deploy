import { ProtocolError } from '@metacall/protocol/protocol';

/**
 * Mock signup function for testing
 * Validates inputs and returns success message, throws errors for invalid inputs
 */
export default async function signup(
	email: string,
	password: string,
	alias: string
): Promise<string> {
	// Simulate async operation
	await new Promise(resolve => setTimeout(resolve, 10));

	// Mock database of taken emails and aliases
	const takenEmails = ['noot@noot.com', 'taken@example.com'];
	const takenAliases = ['creatoon', 'admin', 'root', 'test'];

	// Validate email format
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		const err = new Error('Invalid email') as ProtocolError;
		err.data = 'Invalid email';
		throw err;
	}

	// Check if email is already taken
	if (takenEmails.includes(email)) {
		const err = new Error(
			'This email is already associated with an account. Please log in instead.'
		) as ProtocolError;
		err.data =
			'This email is already associated with an account. Please log in instead.';
		throw err;
	}

	// Check if alias is already taken
	if (takenAliases.includes(alias.toLowerCase())) {
		const err = new Error('This alias is already taken') as ProtocolError;
		err.data = 'This alias is already taken';
		throw err;
	}

	// Check password length
	if (password.length < 4) {
		const err = new Error(
			'Password must be at least 4 characters'
		) as ProtocolError;
		err.data = 'Password must be at least 4 characters';
		throw err;
	}

	// Success response
	return 'A verification email has been sent to your email address. Please verify your email to complete the signup process.';
}
