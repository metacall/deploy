import { Deployment } from '@metacall/protocol/deployment';
import API from '@metacall/protocol/protocol';
import chalk from 'chalk';
import { Table } from 'console-table-printer';
import { Config } from '../config';
import { sleep } from './../utils';

interface row {
	Deployments: string;
	Status: string;
	Version: string;
	Ports: number[] | string;
	Endpoints: string;
}

const colorStatus = (status: string): string => {
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

const genRow = (
	Deployments: string,
	Status: string,
	Version: string,
	Ports: number[] | string,
	Endpoints: string
): row => {
	return { Deployments, Status, Version, Ports, Endpoints };
};

const genSingleURL = (
	packageType: string,
	apiURL: string,
	app: Deployment,
	f: { name: string; async: boolean }
): string => {
	const prefix = app.prefix;
	const suffix = app.suffix;
	const version = app.version;
	const funcName = f.name;
	const funcType =
		packageType === 'file' ? 'static' : f.async ? 'await' : 'call';

	return `${apiURL}/${prefix}/${suffix}/${version}/${funcType}/${funcName}`;
};

const genAllURL = (
	res: Deployment[],
	apiURL: string
): { [k: string]: string[] } => {
	const urls: { [k: string]: string[] } = {};

	res.forEach(el => {
		urls[el.suffix] = [];

		Object.entries(el.packages).forEach(pack =>
			pack[1].forEach(ele =>
				ele.scope.funcs.forEach(f =>
					urls[el.suffix].push(genSingleURL(pack[0], apiURL, el, f))
				)
			)
		);
	});

	return urls;
};

export const inspect = async (config: Config): Promise<void> => {
	const api = API(config.token as string, config.baseURL);

	for (;;) {
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

		const urls = genAllURL(res, config.apiURL);

		const allApps = res.map(el => {
			const suffix = el.suffix;
			const status = colorStatus(el.status);
			const version = el.version;
			const ports = el.ports.length > 0 ? el.ports : '---';
			const url =
				urls[el.suffix].length > 0 ? urls[el.suffix][0] : '   ---';

			return genRow(suffix, status, version, ports, url);
		});

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
		await sleep(5000);
	}
};
