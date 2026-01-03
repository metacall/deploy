import { Deployment, LogType, MetaCallJSON } from '@metacall/protocol/deployment';
import { Plans } from '@metacall/protocol/plan';
import API, { API as APIInterface } from '@metacall/protocol/protocol';
import { AuthenticationError, NetworkError } from '../../errors/CLIError';
import { DeploymentConfig } from '../../schemas/DeploymentSchema';
import { IProtocolService } from '../../types/service.types';
import { RetryPolicy } from '../RetryPolicy';

export class ProtocolClient implements IProtocolService {
	private readonly api: APIInterface;

	constructor(token: string, baseURL: string, private readonly retryPolicy: RetryPolicy) {
		this.api = API(token, baseURL);
	}

	async deploy(config: DeploymentConfig): Promise<{
		suffix: string;
		prefix: string;
		version: string;
	}> {
		return this.retryPolicy.execute(async () => {
			try {
				const { ResourceType } = await import('@metacall/protocol/protocol');
				const resourceType = config.repo ? ResourceType.Repository : ResourceType.Package;
				const name = config.repo
					? (config as DeploymentConfig & { repositoryId?: string }).repositoryId || config.name
					: config.name;

				const env = config.env
					? Object.entries(config.env).map(([name, value]) => ({
							name,
							value
					  }))
					: [];

				return (await this.api.deploy(name, env, config.plan, resourceType, Date.now().toString(16), 'v1')) as {
					suffix: string;
					prefix: string;
					version: string;
				};
			} catch (error) {
				if (error instanceof Error) {
					throw new NetworkError(`Deployment failed: ${error.message}`, error);
				}
				throw error;
			}
		});
	}

	async inspect(): Promise<Deployment[]> {
		return this.retryPolicy.execute(async () => {
			try {
				return await this.api.inspect();
			} catch (error) {
				if (error instanceof Error) {
					throw new NetworkError(`Inspect failed: ${error.message}`, error);
				}
				throw error;
			}
		});
	}

	async inspectById(id: string): Promise<Deployment> {
		return this.retryPolicy.execute(async () => {
			try {
				const deployments = await this.api.inspect();
				const deployment = deployments.find(d => d.suffix === id);
				if (!deployment) {
					throw new Error(`Deployment ${id} not found`);
				}
				return deployment;
			} catch (error) {
				if (error instanceof Error) {
					throw new NetworkError(`Inspect failed: ${error.message}`, error);
				}
				throw error;
			}
		});
	}

	async delete(id: string): Promise<void>;
	async delete(prefix: string, suffix: string, version: string): Promise<void>;
	async delete(idOrPrefix: string, suffix?: string, version?: string): Promise<void> {
		return this.retryPolicy.execute(async () => {
			try {
				if (suffix !== undefined && version !== undefined) {
					await this.api.deployDelete(idOrPrefix, suffix, version);
				} else {
					const deployments = await this.api.inspect();
					const deployment = deployments.find(d => d.suffix === idOrPrefix);
					if (!deployment) {
						throw new Error(`Deployment ${idOrPrefix} not found`);
					}
					await this.api.deployDelete(deployment.prefix, deployment.suffix, deployment.version || 'v1');
				}
			} catch (error) {
				if (error instanceof Error) {
					throw new NetworkError(`Delete failed: ${error.message}`, error);
				}
				throw error;
			}
		});
	}

	async listSubscriptions(): Promise<Record<string, number>> {
		return this.retryPolicy.execute(async () => {
			try {
				return await this.api.listSubscriptions();
			} catch (error) {
				if (error instanceof Error) {
					throw new NetworkError(`List subscriptions failed: ${error.message}`, error);
				}
				throw error;
			}
		});
	}

	async listSubscriptionsDeploys(): Promise<Array<{ deploy: string; plan: Plans }>> {
		return this.retryPolicy.execute(async () => {
			try {
				return (await this.api.listSubscriptionsDeploys()) as Array<{
					deploy: string;
					plan: Plans;
				}>;
			} catch (error) {
				if (error instanceof Error) {
					throw new NetworkError(`List subscription deploys failed: ${error.message}`, error);
				}
				throw error;
			}
		});
	}

	async upload(
		name: string,
		blob: Buffer | NodeJS.ReadableStream,
		jsons: MetaCallJSON[] = [],
		runners: string[] = []
	): Promise<string> {
		return this.retryPolicy.execute(async () => {
			try {
				return await this.api.upload(name, blob as unknown, jsons, runners);
			} catch (error) {
				if (error instanceof Error) {
					throw new NetworkError(`Upload failed: ${error.message}`, error);
				}
				throw error;
			}
		});
	}

	async add(url: string, branch: string, jsons: MetaCallJSON[] = []): Promise<{ id: string }> {
		return this.retryPolicy.execute(async () => {
			try {
				return await this.api.add(url, branch, jsons);
			} catch (error) {
				if (error instanceof Error) {
					throw new NetworkError(`Add repository failed: ${error.message}`, error);
				}
				throw error;
			}
		});
	}

	async branchList(url: string): Promise<{ branches: string[] }> {
		return this.retryPolicy.execute(async () => {
			try {
				return await this.api.branchList(url);
			} catch (error) {
				if (error instanceof Error) {
					throw new NetworkError(`Branch list failed: ${error.message}`, error);
				}
				throw error;
			}
		});
	}

	async fileList(url: string, branch: string): Promise<string[]> {
		return this.retryPolicy.execute(async () => {
			try {
				return await this.api.fileList(url, branch);
			} catch (error) {
				if (error instanceof Error) {
					throw new NetworkError(`File list failed: ${error.message}`, error);
				}
				throw error;
			}
		});
	}

	async logs(container: string, type: LogType, suffix: string, prefix: string, version = 'v1'): Promise<string> {
		return this.retryPolicy.execute(async () => {
			try {
				return await this.api.logs(container, type, suffix, prefix, version);
			} catch (error) {
				if (error instanceof Error) {
					throw new NetworkError(`Get logs failed: ${error.message}`, error);
				}
				throw error;
			}
		});
	}

	async deployDelete(prefix: string, suffix: string, version = 'v1'): Promise<string> {
		return this.retryPolicy.execute(async () => {
			try {
				return await this.api.deployDelete(prefix, suffix, version);
			} catch (error) {
				if (error instanceof Error) {
					throw new NetworkError(`Delete deployment failed: ${error.message}`, error);
				}
				throw error;
			}
		});
	}

	async validateToken(): Promise<boolean> {
		return this.retryPolicy.execute(async () => {
			try {
				return await this.api.validate();
			} catch (error) {
				if (error instanceof Error) {
					throw new AuthenticationError(`Token validation failed: ${error.message}`, error);
				}
				throw error;
			}
		});
	}

	async refreshToken(): Promise<string> {
		return this.retryPolicy.execute(async () => {
			try {
				return await this.api.refresh();
			} catch (error) {
				if (error instanceof Error) {
					throw new AuthenticationError(`Token refresh failed: ${error.message}`, error);
				}
				throw error;
			}
		});
	}

	async deployEnabled(): Promise<boolean> {
		return this.retryPolicy.execute(async () => {
			try {
				return await this.api.deployEnabled();
			} catch (error) {
				if (error instanceof Error) {
					throw new NetworkError(`Deploy enabled check failed: ${error.message}`, error);
				}
				throw error;
			}
		});
	}

	getApiClient(): APIInterface {
		return this.api;
	}
}
