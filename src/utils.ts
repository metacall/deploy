
export const fatal: (message: any) => never = message => {
	console.error(message);
	process.exit(1);
	// Needed for TypeScript
	throw new Error(message);
};
