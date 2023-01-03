import { prompt } from 'inquirer';

export const input = (message: string): Promise<string> =>
	prompt<{ data: string }>([
		{
			type: 'input',
			name: 'data',
			message
		}
	]).then(res => res.data);

export const maskedInput = (message: string): Promise<string> =>
	prompt<{ data: string }>([
		{
			type: 'password',
			name: 'data',
			message,
			mask: '*'
		}
	]).then(res => res.data);
