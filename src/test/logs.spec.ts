import { deepStrictEqual } from 'assert';
import { getAppendedLogLines } from '../logs';

describe('logs polling', () => {
	it('prints repeated lines when they are appended later', () => {
		const firstPoll = getAppendedLogLines([], 'retrying connection\n');
		const secondPoll = getAppendedLogLines(
			firstPoll.nextLogs,
			'retrying connection\nretrying connection\n'
		);

		deepStrictEqual(firstPoll.appendedLogs, ['retrying connection']);
		deepStrictEqual(secondPoll.appendedLogs, ['retrying connection']);
	});

	it('does not reprint lines when the snapshot is unchanged', () => {
		const previousLogs = ['line 1', 'line 2'];
		const nextPoll = getAppendedLogLines(previousLogs, 'line 1\nline 2\n');

		deepStrictEqual(nextPoll.appendedLogs, []);
		deepStrictEqual(nextPoll.nextLogs, previousLogs);
	});

	it('prints only the appended tail for growing snapshots', () => {
		const nextPoll = getAppendedLogLines(
			['booting'],
			'booting\nready\nserving traffic\n'
		);

		deepStrictEqual(nextPoll.appendedLogs, ['ready', 'serving traffic']);
	});

	it('replays the snapshot when the log stream resets', () => {
		const nextPoll = getAppendedLogLines(
			['old line 1', 'old line 2'],
			'new line 1\n'
		);

		deepStrictEqual(nextPoll.appendedLogs, ['new line 1']);
		deepStrictEqual(nextPoll.nextLogs, ['new line 1']);
	});

	it('replays the snapshot when the server returns a rewritten history', () => {
		const nextPoll = getAppendedLogLines(
			['line 1', 'line 2'],
			'line 1\nline changed\nline 3\n'
		);

		deepStrictEqual(nextPoll.appendedLogs, [
			'line 1',
			'line changed',
			'line 3'
		]);
	});
});
