import { prompt } from 'inquirer';

export const input = (message: string): Promise<string> =>
	prompt<{ data: string }>([
		{
			type: 'input',
			name: 'data',
			message
		}
	]).then(res => res.data);
