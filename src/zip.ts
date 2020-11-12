import archiver, { Archiver } from 'archiver';
import { promises as fs } from 'fs';
import Gauge from 'gauge';
import { join } from 'path';

const { readdir, stat } = fs;

export const zip = (source = '.', ignore: string[] = []): Archiver => {
	const gauge = new Gauge();
	const archive = archiver('zip', {
		zlib: { level: 9 }
	});
	archive.on('progress', data =>
		gauge.show(
			'Compressing and uploading...',
			data.fs.processedBytes / data.fs.totalBytes
		)
	);
	archive.on('entry', entry => gauge.pulse(entry.name));

	void readdir(source)
		.then(files => files.filter(file => !ignore.includes(file)))
		.then(async files => {
			for (const file of files) {
				(await stat(join(source, file))).isDirectory()
					? archive.directory(join(source, file), file)
					: archive.file(join(source, file), { name: file });
			}
			await archive.finalize();
		});
	return archive;
};
