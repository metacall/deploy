import { ok } from 'assert';
import { opt } from '../utils';

describe('unit opt', () => {
	it('Should call a function with the provided string', () => {
		ok(opt(x => x, 'hello') === 'hello');
	});
	it('Should return empty string when second argument is null', () => {
		ok(opt(x => x, null) === '');
	});
});
