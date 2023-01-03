import { printHelp } from '../help';
import args from './args';
import { warn } from './messages';

export const handleUnknownArgs = (): void => {
	const flags = args['_unknown'];

	if (!(flags.length === 1 && (flags[0] === '--help' || flags[0] === '-h'))) {
		const message = `${flags.join(
			', '
		)} does not exists as a valid command.`;
		warn(message);
	}

	printHelp();
};
