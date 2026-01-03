import { promises as fs } from 'fs';
import { join } from 'path';
import { LanguageId, MetaCallJSON } from '@metacall/protocol/deployment';
import { generateJsonsFromFiles } from '@metacall/protocol/package';
import { selectLanguage, selectFile, confirm } from './prompts';
import { printLanguage } from '../utils/languageUtils';
import { getLogger } from '../utils/logger';

export class PackageWizard {
	async createJsonsAndDeploy(
		files: string[],
		rootPath: string
	): Promise<{ packages: MetaCallJSON[]; shouldSave: boolean }> {
		let languages: LanguageId[] = [];
		let packages: MetaCallJSON[] = [];

		const potentialPackages = generateJsonsFromFiles(files);
		const potentialLanguages = Array.from(
			new Set<LanguageId>(potentialPackages.reduce<LanguageId[]>((langs, pkg) => [...langs, pkg.language_id], []))
		);

		let wait = true;
		do {
			languages = await selectLanguage(potentialLanguages, 'Select languages to run on MetaCall');

			if (languages.length === 0) {
				getLogger().warn(
					'You must choose a language in order to proceed with the deployment procedure, do not continue without doing so.'
				);
				wait = false;
				continue;
			}

			packages = potentialPackages.filter(pkg => languages.includes(pkg.language_id));

			for (const pkg of packages) {
				if (pkg.scripts && pkg.scripts.length > 0) {
					pkg.scripts = await selectFile(
						pkg.scripts,
						`Select files to load with ${printLanguage(pkg.language_id)}`
					);
				}
			}

			const langId: LanguageId[] = [];
			for (const pkg of packages) {
				if (!pkg.scripts || pkg.scripts.length === 0) {
					langId.push(pkg.language_id);
				}
			}

			if (!langId.length) {
				break; // All languages have files selected
			}

			if (langId.length === packages.length) {
				getLogger().warn(
					'You must choose a file to continue the deployment procedure, do not continue without doing so.'
				);
				wait = false;
				continue;
			}

			const langNames = langId.map(lang => printLanguage(lang)).join(', ');
			const deployConsent = await confirm(
				`You selected language${
					langId.length > 1 ? 's' : ''
				} ${langNames} but you didn't select any file, do you want to continue?`
			);

			wait = deployConsent;
		} while (!wait);

		const saveConsent = await confirm('Do you want to save metacall.json file?');

		if (saveConsent) {
			for (const pkg of packages) {
				if (pkg.scripts && pkg.scripts.length === 0) continue;

				await fs.writeFile(join(rootPath, `metacall-${pkg.language_id}.json`), JSON.stringify(pkg, null, 2));
			}

			return { packages: [], shouldSave: true };
		}

		return { packages, shouldSave: false };
	}
}
