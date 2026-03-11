import { ErrorCode } from '../deploy';
import { printHelp } from '../help';
import args from './args';
import { warn } from './messages';

export const handleUnknownArgs = (): void => {
	const flags = args['_unknown'];

	const isHelpFlag =
		flags.length === 1 && (flags[0] === '--help' || flags[0] === '-h');

	if (!isHelpFlag) {
		const message = `${flags.join(
			', '
		)} does not exist as a valid command.`;
		warn(message);
		printHelp(ErrorCode.InvalidArguments);
		return;
	}

	printHelp();
};
