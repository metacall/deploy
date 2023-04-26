import { Deployment, LanguageId, ValueId } from '@metacall/protocol/deployment';
import { Languages } from '@metacall/protocol/language';
import { API as APIInterface } from '@metacall/protocol/protocol';
import chalk from 'chalk';
import { Table } from 'console-table-printer';
import { OpenAPIV3 } from 'openapi-types';
import { Config } from '../config';
import { sleep } from './../utils';
import args, { InspectFormat } from './args';
import { error } from './messages';

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

const getFunctionInvokeMethod = (packageType: string, asyncness: boolean) =>
	packageType === 'file' ? 'static' : asyncness ? 'await' : 'call';

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
	const funcType = getFunctionInvokeMethod(packageType, f.async);

	return `${apiURL}/${prefix}/${suffix}/${version}/${funcType}/${funcName}`;
};

const genAllURL = (
	res: Deployment[],
	apiURL: string
): { [k: string]: string[] } => {
	const urls: { [k: string]: string[] } = {};
	const languageSupported = Object.keys(Languages);

	res.forEach(el => {
		urls[el.suffix] = [];

		Object.entries(el.packages).forEach(
			pack =>
				languageSupported.includes(pack[0]) &&
				pack[1].forEach(ele =>
					ele.scope.funcs.forEach(f =>
						urls[el.suffix].push(
							genSingleURL(pack[0], apiURL, el, f)
						)
					)
				)
		);
	});

	return urls;
};

type InspectPrint = {
	[key in InspectFormat]: (
		config: Config,
		api: APIInterface
	) => Promise<void>;
};

const functionTypeIdToOpenAPIv3 = (
	type: ValueId
): OpenAPIV3.ArraySchemaObject | OpenAPIV3.NonArraySchemaObject => {
	const conversionMap: Partial<
		Record<ValueId, OpenAPIV3.NonArraySchemaObjectType>
	> = {
		[ValueId.METACALL_BOOL]: 'boolean',
		[ValueId.METACALL_CHAR]: 'string',
		[ValueId.METACALL_SHORT]: 'number',
		[ValueId.METACALL_INT]: 'number',
		[ValueId.METACALL_LONG]: 'number',
		[ValueId.METACALL_FLOAT]: 'number',
		[ValueId.METACALL_DOUBLE]: 'number',
		[ValueId.METACALL_STRING]: 'string',
		[ValueId.METACALL_BUFFER]: 'string',
		[ValueId.METACALL_MAP]: 'object',
		[ValueId.METACALL_OBJECT]: 'object'
	};

	if (type === ValueId.METACALL_ARRAY) {
		return {
			type: 'array',
			items: {}
		};
	}

	return {
		type: conversionMap[type] || undefined
	};
};

const rawInspectToOpenAPIv3 = (
	baseURL: string,
	deployments: Deployment[]
): OpenAPIV3.Document[] => {
	return deployments.map(deployment => {
		const paths: OpenAPIV3.PathsObject = {};

		Object.keys(deployment.packages).forEach(language => {
			const handles = deployment.packages[language as LanguageId];
			const funcs = handles
				.map(handle => {
					return handle.scope.funcs;
				})
				.flatMap(func => func);

			funcs.forEach(func => {
				const method =
					func.signature.args.length === 0 ? 'get' : 'post';

				const invokeMethod = getFunctionInvokeMethod(
					language,
					func.async
				);

				const properties: {
					[name: string]:
						| OpenAPIV3.ReferenceObject
						| OpenAPIV3.SchemaObject;
				} = {};

				if (method === 'post') {
					func.signature.args.forEach(prop => {
						properties[prop.name] = functionTypeIdToOpenAPIv3(
							prop.type.id
						);
					});
				}

				paths[`/${invokeMethod}/${func.name}`] = {
					[method]: {
						summary: '',
						description: '',
						requestBody:
							method === 'post'
								? {
										description: '',
										required: true,
										content: {
											'application/json': {
												schema: {
													type: 'object',
													properties
												}
											}
										}
								  }
								: undefined,
						responses: {
							'200': {
								description: '',
								content: {
									'application/json': {
										schema: functionTypeIdToOpenAPIv3(
											func.signature.ret.type.id
										)
									}
								}
							}
						}
					}
				};
			});
		});

		return {
			openapi: '3.0.0',
			info: {
				title: `MetaCall Cloud FaaS deployment '${deployment.suffix}'`,
				description: '',
				version: deployment.version
			},
			servers: [
				{
					url: `${baseURL}/${deployment.prefix}/${deployment.suffix}/${deployment.version}`,
					description: 'MetaCall Cloud FaaS'
				}
			],
			paths
		};
	});
};

const inspectPrint: InspectPrint = {
	[InspectFormat.Table]: async (
		config: Config,
		api: APIInterface
	): Promise<void> => {
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

			const urls = genAllURL(
				res,
				args['dev'] ? config.devURL : config.apiURL
			);

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

				if (i < allApps.length - 1)
					p.addRow(genRow('', '', '', [], ''));
			});

			p.printTable();
			await sleep(5000);
		}
	},
	[InspectFormat.Raw]: async (
		_config: Config,
		api: APIInterface
	): Promise<void> => {
		const res = await api.inspect();
		console.log(JSON.stringify(res, null, 2));
	},
	[InspectFormat.OpenAPIv3]: async (
		config: Config,
		api: APIInterface
	): Promise<void> => {
		const res = await api.inspect();
		console.log(
			JSON.stringify(
				rawInspectToOpenAPIv3(
					args['dev'] ? config.devURL : config.apiURL,
					res
				),
				null,
				2
			)
		);
	},
	[InspectFormat.Invalid]: async (
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_config: Config,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_api: APIInterface
	): Promise<void> => {
		const values = Object.values(InspectFormat)
			.filter(x => typeof x === 'string' && x !== 'Invalid')
			.join(', ');
		error(`Invalid format passed to inspect, valid formats are: ${values}`);
		await sleep(100);
	}
};

export const inspect = async (
	format: InspectFormat,
	config: Config,
	api: APIInterface
): Promise<void> => {
	await inspectPrint[format](config, api);
};
