export const availableCommands = [
	'deploy',
	'inspect',
	'delete',
	'plans',
	'logs',
	'login',
	'logout',
	'version',
	'help'
];

export function levenshteinDistance(str1: string, str2: string): number {
	const matrix: number[][] = [];

	for (let i = 0; i <= str2.length; i++) {
		matrix[i] = [i];
	}

	for (let j = 0; j <= str1.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= str2.length; i++) {
		for (let j = 1; j <= str1.length; j++) {
			if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j] + 1
				);
			}
		}
	}

	return matrix[str2.length][str1.length];
}

export function findSimilarCommand(input: string): string | null {
	let minDistance = Infinity;
	let closestCommand: string | null = null;

	for (const command of availableCommands) {
		const distance = levenshteinDistance(input.toLowerCase(), command.toLowerCase());
		if (distance < minDistance && distance <= 2) {
			minDistance = distance;
			closestCommand = command;
		}
	}

	return closestCommand;
}

export function formatErrorMessage(args: string[]): string {
	if (args.length === 0) {
		return 'No command specified. Use "metacall-deploy help" to see available commands.';
	}

	const input = args[0];
	const similarCommand = findSimilarCommand(input);

	let message = `Unknown command: "${input}"\n\n`;
	message += 'Available commands:\n';
	availableCommands.forEach(cmd => {
		message += `  ${cmd}\n`;
	});

	if (similarCommand) {
		message += `\nDid you mean "${similarCommand}"?`;
		message += `\nRun "metacall-deploy ${similarCommand} --help" for more information.`;
	} else {
		message += '\nRun "metacall-deploy help" for more information.';
	}

	return message;
}

