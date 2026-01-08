import archiver, { Archiver } from 'archiver';
import { basename, join, relative } from 'path';
import { promises as fs } from 'fs';
import { getLogger } from './logger';

export async function zip(
	source: string,
	files: string[],
	progress?: (text: string, bytes: number) => void,
	pulse?: (name: string) => void,
	hide?: () => void
): Promise<Archiver> {
	const archive = archiver('zip', {
		zlib: { level: 9 }
	});

	if (progress) {
		archive.on('progress', data => {
			const percentage = data.fs.totalBytes > 0 ? data.fs.processedBytes / data.fs.totalBytes : 0;
			progress('Compressing and deploying...', percentage);
		});
	}

	if (pulse) {
		archive.on('entry', (entry: archiver.EntryData) => {
			if (entry.name) {
				pulse(entry.name);
			}
		});
	}

	const resolvedFiles = files.map(file => join(source, file));

	for (const file of resolvedFiles) {
		try {
			const stat = await fs.stat(file);
			if (stat.isDirectory()) {
				archive.directory(file, basename(file));
			} else {
				archive.file(file, { name: relative(source, file) });
			}
		} catch (error) {
			getLogger().warn(`Skipping file ${file}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	if (hide) {
		archive.on('finish', () => hide());
	}

	await archive.finalize();

	return archive;
}
