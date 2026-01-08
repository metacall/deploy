export function isInteractive(): boolean {
	return process.stdout.isTTY && !process.env.CI;
}
