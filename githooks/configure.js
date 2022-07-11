const { run } = require('./common');

module.exports = {
	configure: async () => {
		return await run('git', [
			'config',
			'--local',
			'core.hooksPath',
			__dirname
		]);
	}
};
