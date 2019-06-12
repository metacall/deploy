
export const fatal = (message: any) => {
	console.error(message);
	return process.exit(1);
};
