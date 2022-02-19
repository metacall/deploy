import chalk from 'chalk';
import { Table } from 'console-table-printer';
import { Deployment } from 'metacall-protocol/deployment';
import API from 'metacall-protocol/protocol';
import { startup } from './../startup';

interface row {
	Deployments: string;
	Status: string;
	Version: string;
	Ports: number[] | string;
	Endpoints: string;
}

const genRow = (
	Deployments: string,
	Status: string,
	Version: string,
	Ports: number[] | string,
	Endpoints: string
): row => {
	return { Deployments, Status, Version, Ports, Endpoints };
};

const colors = (status: string): string => {
	switch (status) {
		case 'create':
			status = chalk.yellowBright(status);
			break;
		case 'ready':
			status = chalk.greenBright(status);
			break;
		default:
			status = chalk.redBright(status);
	}

	return status;
};

const genUrls = (
	res: Deployment[],
	apiURL: string
): { [k: string]: string[] } => {
	const urls: { [k: string]: string[] } = {};

	res.forEach(el => {
		urls[el.suffix] = [];

		Object.entries(el.packages).forEach(pack =>
			pack[1].forEach(ele =>
				ele.scope.funcs.forEach(f =>
					urls[el.suffix].push(
						`${apiURL}/${el.prefix}/${el.suffix}/${el.version}/${
							pack[0] === 'file' ? 'static' : 'call'
						}/${f.name}`
					)
				)
			)
		);
	});

	return urls;
};

const sleep = (ms: number) => {
	return new Promise(resolve => setTimeout(resolve, ms));
};

export const ins = async (): Promise<void> => {
	const config = await startup();

	const api = API(config.token as string, config.baseURL);

	for (;;) {
		await sleep(5000);
		const res = await api.inspect();

		console.clear();

		const p = new Table({
			columns: [
				{ name: 'Deployments', alignment: 'left' },
				{ name: 'Status', alignment: 'left' },
				{ name: 'Version', alignment: 'center' },
				{ name: 'Ports', alignment: 'center' },
				{ name: 'Endpoints', alignment: 'left' }
			]
		});

		const urls = genUrls(res, config.apiURL);

		const allApps = res.map(el =>
			genRow(
				el.suffix,
				colors(el.status),
				el.version,
				el.ports.length > 0 ? el.ports : '---',
				urls[el.suffix].length > 0 ? urls[el.suffix][0] : '   ---'
			)
		);

		allApps.forEach((app, i) => {
			p.addRow(app);

			const appUrls =
				typeof urls[app.Deployments] !== 'undefined'
					? urls[app.Deployments]
					: [];

			if (appUrls.length > 0)
				appUrls
					.slice(1)
					.forEach(el => p.addRow(genRow('', '', '', [], el)));

			if (i < allApps.length - 1) p.addRow(genRow('', '', '', [], ''));
		});

		p.printTable();
	}
};
