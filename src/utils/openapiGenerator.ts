import { Deployment, LanguageId, ValueId } from '@metacall/protocol/deployment';
import { OpenAPIV3 } from 'openapi-types';

type Func = {
	name: string;
	signature: {
		ret: { type: { id: ValueId; name: string } };
		args: Array<{ name: string; type: { id: ValueId; name: string } }>;
	};
	async: boolean;
};

function functionTypeIdToOpenAPIv3(type: ValueId): OpenAPIV3.ArraySchemaObject | OpenAPIV3.NonArraySchemaObject {
	const conversionMap: Partial<Record<ValueId, OpenAPIV3.NonArraySchemaObjectType>> = {
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
}

function getFunctionInvokeMethod(packageType: string, asyncness: boolean): string {
	return packageType === 'file' ? 'static' : asyncness ? 'await' : 'call';
}

export function rawInspectToOpenAPIv3(baseURL: string, deployments: Deployment[]): OpenAPIV3.Document[] {
	return deployments.map(deployment => {
		const paths: OpenAPIV3.PathsObject = {};

		(Object.keys(deployment.packages) as LanguageId[]).forEach(language => {
			const handles = deployment.packages[language];
			const funcs = handles.map(handle => handle.scope.funcs as Func[]).flatMap(funcArray => funcArray);

			funcs.forEach((func: Func) => {
				const method = func.signature.args.length === 0 ? 'get' : 'post';
				const invokeMethod = getFunctionInvokeMethod(language, func.async);

				const properties: {
					[name: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;
				} = {};

				if (method === 'post') {
					func.signature.args.forEach(prop => {
						properties[prop.name] = functionTypeIdToOpenAPIv3(prop.type.id);
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
										schema: functionTypeIdToOpenAPIv3(func.signature.ret.type.id)
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
}
