export const isInteractive = () => {
	// Define this environment variable to allow tests to be interactive
	// even if they run inside a non interactive tty
	if (process.env.NODE_ENV === 'testing') {
		return (
			process.env.METACALL_DEPLOY_INTERACTIVE === 'true' ||
			process.env.METACALL_DEPLOY_INTERACTIVE === '1'
		);
	}

	return process.stdin.isTTY === true;
};

export const showInteractiveMessage = (): void => {
	const isTTY: boolean = process.stdout.isTTY;
	const isInteractiveMode: boolean = isInteractive();

	if (isTTY || isInteractiveMode) {
		console.log('Press Ctrl+C to exit');
	}
};
