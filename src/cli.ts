import { prompt } from 'inquirer';

export const input = (message: string, type = 'input') =>
	prompt([
		{
			name: 'data',
			message,
			type
		}
	] as any).then((res: any) => res.data);
