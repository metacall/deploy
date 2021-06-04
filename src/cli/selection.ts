import inquirer, { prompt } from 'inquirer';
import FileTreeSelectionPrompt from 'inquirer-file-tree-selection-prompt';
import { join } from 'path';

inquirer.registerPrompt('file-tree-selection', FileTreeSelectionPrompt);

export const fileSelection = (
	message: string,
	path: string = process.cwd(),
	files: string[] = []
): Promise<string[]> => {
	const absolutePathFiles = files.map(x => join(path, x));
	console.log(absolutePathFiles);

	return prompt<{ files: string[] }>([
		{
			type: 'file-tree-selection',
			name: 'file',
			message,
			root: path,
			multiple: true,
			hideRoot: false,
			onlyShowValid: true,
			validate: (dirPath: string | undefined): boolean => {
				return (
					!!dirPath &&
					(absolutePathFiles.length === 0 ||
						absolutePathFiles.findIndex(curPath =>
							curPath.startsWith(dirPath)
						) !== -1)
				);
			}
		}
	]).then(res => res.files);
};
