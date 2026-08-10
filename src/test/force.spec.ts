import { strictEqual, throws } from 'assert';
import { getSuffixFromUrl } from '../force';

describe('force URL parsing logic', () => {
	it('should parse GitHub URLs correctly', () => {
		strictEqual(
			getSuffixFromUrl('https://github.com/mygroup/myrepo'),
			'mygroup-myrepo'
		);
	});

	it('should parse GitLab URLs correctly', () => {
		strictEqual(
			getSuffixFromUrl('https://gitlab.com/mygroup/myrepo'),
			'mygroup-myrepo'
		);
	});

	it('should parse arbitrary URLs correctly', () => {
		strictEqual(
			getSuffixFromUrl('http://git.mycompany.local/group/subgroup/repo'),
			'group-subgroup-repo'
		);
	});

	it('should throw on invalid URLs', () => {
		throws(() => getSuffixFromUrl('not-a-valid-url'));
	});
});
