import inquirer, { prompt } from 'inquirer';
import FileTreeSelectionPrompt from 'inquirer-file-tree-selection-prompt';

inquirer.registerPrompt('file-tree-selection', FileTreeSelectionPrompt);

export const fileSelection = (
	message: string,
	path: string = process.cwd(),
	files: string[] = []
): Promise<string> =>
	prompt<{ data: string }>([
		{
			type: 'file-tree-selection',
			name: 'file',
			message,
			root: path,
			multiple: true,
			validate: (x: string): boolean =>
				files.length === 0 || files.includes(x)
		}
	]).then(res => res.data);
