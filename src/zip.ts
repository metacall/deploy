import { join } from 'path';
import { tmpdir } from 'os';
import { createWriteStream, readdir as READDIR, stat as STAT } from 'fs';
import { promisify } from 'util';

import archiver from 'archiver';
import Gauge from 'gauge';

const readdir = promisify(READDIR);
const stat = promisify(STAT);

export const zip = (name: string, ignore: string[] = [], source = '.', destination = join(tmpdir(), name + '.zip')) => {
	const gauge = new Gauge();
	const archive = archiver('zip', {
		zlib: { level: 9 }
	});
	archive.on('progress', data =>
		gauge.show('Compressing project...', data.entries.processed / data.entries.total));
	archive.on('entry', entry =>
		gauge.pulse(entry.name));

	return readdir(source)
		.then(files => files.filter(file => !ignore.includes(file)))
		.then(async files => {
			for (const file of files) {
				(await stat(join(source, file))).isDirectory()
					? archive.directory(join(source, file), file)
					: archive.file(join(source, file), { name: file });
			}
			archive.finalize();
			return new Promise((resolve, reject) =>
				archive.pipe(createWriteStream(destination))
					.once('error', reject)
					.once('finish', resolve));
		});
};
