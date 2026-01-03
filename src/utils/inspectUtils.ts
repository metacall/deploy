import { Deployment, LanguageId, ValueId } from '@metacall/protocol/deployment';
import { Languages } from '@metacall/protocol/language';
import chalk from 'chalk';
import { Table } from 'console-table-printer';

type Func = {
	name: string;
	signature: {
		ret: { type: { id: ValueId; name: string } };
		args: Array<{ name: string; type: { id: ValueId; name: string } }>;
	};
	async: boolean;
};

export function colorStatus(status: string): string {
	switch (status) {
		case 'create':
			return chalk.yellowBright(status);
		case 'ready':
			return chalk.greenBright(status);
		case 'fail':
			return chalk.redBright(status);
		default:
			return chalk.redBright(status);
	}
}

function getFunctionInvokeMethod(packageType: string, asyncness: boolean): string {
	return packageType === 'file' ? 'static' : asyncness ? 'await' : 'call';
}

function genSingleURL(packageType: string, apiURL: string, app: Deployment, func: Func): string {
	const prefix = app.prefix;
	const suffix = app.suffix;
	const version = app.version;
	const funcName = func.name;
	const funcType = getFunctionInvokeMethod(packageType, func.async);

	return `${apiURL}/${prefix}/${suffix}/${version}/${funcType}/${funcName}`;
}

export function genAllURL(res: Deployment[], apiURL: string): Record<string, string[]> {
	const urls: Record<string, string[]> = {};
	const languageSupported = Object.keys(Languages);

	res.forEach(el => {
		urls[el.suffix] = [];

		(Object.entries(el.packages) as [LanguageId, Deployment['packages'][LanguageId]][]).forEach(pack => {
			const [languageId, handles] = pack;
			if (languageSupported.includes(languageId)) {
				handles.forEach(handle => {
					(handle.scope.funcs as Func[]).forEach((f: Func) => {
						urls[el.suffix].push(genSingleURL(languageId, apiURL, el, f));
					});
				});
			}
		});
	});

	return urls;
}

export function genRow(
	Deployments: string,
	Status: string,
	Version: string,
	Ports: number[] | string,
	Endpoints: string
): {
	Deployments: string;
	Status: string;
	Version: string;
	Ports: number[] | string;
	Endpoints: string;
} {
	return { Deployments, Status, Version, Ports, Endpoints };
}

export function printTable(
	deployments: Deployment[],
	apiURL: string,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_dev = false
): void {
	const table = new Table({
		columns: [
			{ name: 'Deployments', alignment: 'left' },
			{ name: 'Status', alignment: 'left' },
			{ name: 'Version', alignment: 'center' },
			{ name: 'Ports', alignment: 'center' },
			{ name: 'Endpoints', alignment: 'left' }
		]
	});

	const urls = genAllURL(deployments, apiURL);

	const allApps = deployments.map(el => {
		const suffix = el.suffix;
		const status = colorStatus(el.status);
		const version = el.version;
		const ports = el.ports.length > 0 ? el.ports : '---';
		const url = urls[el.suffix] && urls[el.suffix].length > 0 ? urls[el.suffix][0] : '   ---';

		return genRow(suffix, status, version, ports, url);
	});

	allApps.forEach((app, i) => {
		table.addRow(app);

		const appUrls = typeof urls[app.Deployments] !== 'undefined' ? urls[app.Deployments] : [];

		if (appUrls.length > 0) {
			appUrls.slice(1).forEach(el => table.addRow(genRow('', '', '', [], el)));
		}

		if (i < allApps.length - 1) {
			table.addRow(genRow('', '', '', [], ''));
		}
	});

	table.printTable();
}
