import { promises as fs } from 'fs';
import { join } from 'path';
import { Deployment, LogType, MetaCallJSON } from '@metacall/protocol/deployment';
import { Plans } from '@metacall/protocol/plan';
import { CONFIG_DIR_NAME } from '../../constants/config.constants';
import { DeploymentConfig } from '../../schemas/DeploymentSchema';
import { IProtocolService } from '../../types/service.types';
import { configDir, ensureFolderExists } from '../../utils/fileUtils';

interface MockState {
	deployments: Record<string, Deployment>;
	subscriptions: Record<string, number>;
	subscriptionDeploys: Array<{ deploy: string; plan: Plans }>;
	uploads: Record<string, string>;
	repositories: Record<string, { id: string; branches: string[]; files: Record<string, string[]> }>;
	deploymentLogs: Record<string, string[]>;
	deploymentCounter: number;
}

export class MockProtocolService implements IProtocolService {
	private static instance: MockProtocolService | null = null;

	private readonly deployments: Map<string, Deployment> = new Map();
	private readonly subscriptions: Map<string, number> = new Map();
	private readonly subscriptionDeploys: Array<{ deploy: string; plan: Plans }> = [];
	private readonly uploads: Map<string, string> = new Map();
	private readonly repositories: Map<string, { id: string; branches: string[]; files: Map<string, string[]> }> = new Map();
	private readonly deploymentLogs: Map<string, string[]> = new Map();
	private deploymentCounter = 0;
	private readonly stateFilePath: string;

	constructor(
		_token: string,
		_baseURL: string,
		_retryPolicy: unknown
	) {
		const configDirPath = configDir(CONFIG_DIR_NAME);
		this.stateFilePath = join(configDirPath, 'deploy', 'mock-state.json');
		void this.loadState();
		MockProtocolService.instance = this;
	}

	static getInstance(): MockProtocolService | null {
		return MockProtocolService.instance;
	}

	static resetInstance(): void {
		MockProtocolService.instance = null;
	}

	private async loadState(): Promise<void> {
		try {
			const stateDir = join(configDir(CONFIG_DIR_NAME), 'deploy');
			await ensureFolderExists(stateDir);
			const stateContent = await fs.readFile(this.stateFilePath, 'utf8').catch(() => '{}');
			const state = JSON.parse(stateContent || '{}') as Partial<MockState>;

			if (state.deployments) {
				Object.entries(state.deployments).forEach(([key, value]) => {
					this.deployments.set(key, value);
				});
			}

			if (state.subscriptions) {
				Object.entries(state.subscriptions).forEach(([key, value]) => {
					this.subscriptions.set(key, value);
				});
			}

			if (state.subscriptionDeploys) {
				this.subscriptionDeploys.push(...state.subscriptionDeploys);
			}

			if (state.uploads) {
				Object.entries(state.uploads).forEach(([key, value]) => {
					this.uploads.set(key, value);
				});
			}

			if (state.repositories) {
				Object.entries(state.repositories).forEach(([key, value]) => {
					const filesMap = new Map<string, string[]>();
					if (value.files) {
						Object.entries(value.files).forEach(([branch, files]) => {
							filesMap.set(branch, files);
						});
					}
					this.repositories.set(key, {
						id: value.id,
						branches: value.branches,
						files: filesMap
					});
				});
			}

			if (state.deploymentLogs) {
				Object.entries(state.deploymentLogs).forEach(([key, value]) => {
					this.deploymentLogs.set(key, value);
				});
			}

			if (state.deploymentCounter !== undefined) {
				this.deploymentCounter = state.deploymentCounter;
			} else {
				this.initializeMockData();
			}
		} catch {
			this.initializeMockData();
		}
	}

	private async saveState(): Promise<void> {
		try {
			const stateDir = join(configDir(CONFIG_DIR_NAME), 'deploy');
			await ensureFolderExists(stateDir);

			const repositoriesState: Record<string, { id: string; branches: string[]; files: Record<string, string[]> }> = {};
			this.repositories.forEach((value, key) => {
				const files: Record<string, string[]> = {};
				value.files.forEach((filesArray, branch) => {
					files[branch] = filesArray;
				});
				repositoriesState[key] = {
					id: value.id,
					branches: value.branches,
					files
				};
			});

			const state: MockState = {
				deployments: Object.fromEntries(this.deployments),
				subscriptions: Object.fromEntries(this.subscriptions),
				subscriptionDeploys: [...this.subscriptionDeploys],
				uploads: Object.fromEntries(this.uploads),
				repositories: repositoriesState,
				deploymentLogs: Object.fromEntries(this.deploymentLogs),
				deploymentCounter: this.deploymentCounter
			};

			await fs.writeFile(this.stateFilePath, JSON.stringify(state, null, 2));
		} catch {
			// Silently fail if we can't save state
		}
	}

	private initializeMockData(): void {
		if (this.subscriptions.size === 0) {
			this.subscriptions.set('Essential' as Plans, 1);
			this.subscriptions.set('Standard' as Plans, 2);
			this.subscriptions.set('Premium' as Plans, 0);
		}
	}

	private generateDeploymentId(): string {
		this.deploymentCounter++;
		return `mock-deploy-${this.deploymentCounter}`;
	}

	private generatePrefix(): string {
		return `mock-prefix-${Math.random().toString(36).substring(2, 9)}`;
	}

	private createMockDeployment(
		name: string,
		plan: Plans,
		resourceType: 'package' | 'repository'
	): Deployment {
		const suffix = this.generateDeploymentId();
		const prefix = this.generatePrefix();
		const version = 'v1';

		const deployment = {
			suffix,
			prefix,
			version,
			name,
			plan,
			status: 'create' as const,
			packages: resourceType === 'package' ? { node: ['index.js'] } : { node: [] },
			repository: resourceType === 'repository' ? { url: 'https://github.com/mock/repo', branch: 'main' } : undefined,
			ports: [],
			createdAt: new Date().toISOString()
		} as unknown as Deployment;

		setTimeout(() => {
			const existing = this.deployments.get(suffix);
			if (existing) {
				existing.status = 'ready';
			}
		}, 1000);

		return deployment;
	}

	deploy(config: DeploymentConfig): Promise<{
		suffix: string;
		prefix: string;
		version: string;
	}> {
		return Promise.resolve(this.deploySync(config));
	}

	private deploySync(config: DeploymentConfig): {
		suffix: string;
		prefix: string;
		version: string;
	} {
		const resourceType = config.repo ? 'repository' : 'package';
		const deployment = this.createMockDeployment(config.name, config.plan, resourceType);

		this.deployments.set(deployment.suffix, deployment);
		this.subscriptionDeploys.push({ deploy: deployment.suffix, plan: config.plan });

		const currentCount = this.subscriptions.get(config.plan) || 0;
		if (currentCount > 0) {
			this.subscriptions.set(config.plan, currentCount - 1);
		}

		const logKey = `${deployment.prefix}-${deployment.suffix}-${deployment.version}`;
		this.deploymentLogs.set(logKey, [
			`[${new Date().toISOString()}] Deployment started`,
			`[${new Date().toISOString()}] Building package...`,
			`[${new Date().toISOString()}] Uploading to MetaCall...`,
			`[${new Date().toISOString()}] Deployment completed successfully`
		]);

		void this.saveState();

		return {
			suffix: deployment.suffix,
			prefix: deployment.prefix,
			version: deployment.version || 'v1'
		};
	}

	inspect(): Promise<Deployment[]> {
		return Promise.resolve(Array.from(this.deployments.values()));
	}

	inspectById(id: string): Promise<Deployment> {
		const deployment = this.deployments.get(id);
		if (!deployment) {
			return Promise.reject(new Error(`Deployment ${id} not found`));
		}
		return Promise.resolve(deployment);
	}

	delete(id: string): Promise<void>;
	delete(prefix: string, suffix: string, version: string): Promise<void>;
	delete(idOrPrefix: string, suffix?: string, version?: string): Promise<void> {
		return Promise.resolve(this.deleteSync(idOrPrefix, suffix, version));
	}

	private deleteSync(idOrPrefix: string, suffix?: string, version?: string): void {
		if (suffix !== undefined && version !== undefined) {
			const deployment = Array.from(this.deployments.values()).find(
				d => d.prefix === idOrPrefix && d.suffix === suffix && d.version === version
			);
			if (deployment) {
				this.deployments.delete(deployment.suffix);
				const index = this.subscriptionDeploys.findIndex(d => d.deploy === deployment.suffix);
				if (index !== -1) {
					this.subscriptionDeploys.splice(index, 1);
				}
			}
		} else {
			const deployment = this.deployments.get(idOrPrefix);
			if (deployment) {
				this.deployments.delete(idOrPrefix);
				const index = this.subscriptionDeploys.findIndex(d => d.deploy === idOrPrefix);
				if (index !== -1) {
					this.subscriptionDeploys.splice(index, 1);
				}
			}
		}
		void this.saveState();
	}

	listSubscriptions(): Promise<Record<string, number>> {
		const result: Record<string, number> = {};
		this.subscriptions.forEach((count, plan) => {
			result[plan] = count;
		});
		return Promise.resolve(result);
	}

	listSubscriptionsDeploys(): Promise<Array<{ deploy: string; plan: Plans }>> {
		return Promise.resolve([...this.subscriptionDeploys]);
	}

	upload(
		name: string,
		_blob: Buffer | NodeJS.ReadableStream,
		_jsons: MetaCallJSON[] = [],
		_runners: string[] = []
	): Promise<string> {
		const uploadId = `mock-upload-${Math.random().toString(36).substring(2, 9)}`;
		this.uploads.set(uploadId, name);
		return Promise.resolve(uploadId);
	}

	add(_url: string, branch: string, _jsons: MetaCallJSON[] = []): Promise<{ id: string }> {
		const repoId = `mock-repo-${Math.random().toString(36).substring(2, 9)}`;
		this.repositories.set(repoId, {
			id: repoId,
			branches: [branch, 'develop', 'staging'],
			files: new Map()
		});

		const repo = this.repositories.get(repoId);
		if (repo) {
			repo.files.set(branch, ['index.js', 'package.json', 'README.md', 'metacall.json']);
		}

		return Promise.resolve({ id: repoId });
	}

	branchList(url: string): Promise<{ branches: string[] }> {
		const repo = Array.from(this.repositories.values()).find(r => r.id.includes(url.split('/').pop() || ''));
		if (repo) {
			return Promise.resolve({ branches: repo.branches });
		}
		return Promise.resolve({ branches: ['main', 'develop', 'staging'] });
	}

	fileList(url: string, branch: string): Promise<string[]> {
		const repo = Array.from(this.repositories.values()).find(r => r.id.includes(url.split('/').pop() || ''));
		if (repo) {
			return Promise.resolve(repo.files.get(branch) || ['index.js', 'package.json']);
		}
		return Promise.resolve(['index.js', 'package.json', 'README.md']);
	}

	logs(container: string, _type: LogType, suffix: string, prefix: string, version = 'v1'): Promise<string> {
		const logKey = `${prefix}-${suffix}-${version}`;
		const logs = this.deploymentLogs.get(logKey) || [];

		const containerLogs = [
			`[${new Date().toISOString()}] Container ${container} started`,
			`[${new Date().toISOString()}] Processing request...`,
			`[${new Date().toISOString()}] Request completed successfully`
		];

		return Promise.resolve([...logs, ...containerLogs].join('\n'));
	}

	deployDelete(prefix: string, suffix: string, version = 'v1'): Promise<string> {
		const deployment = Array.from(this.deployments.values()).find(
			d => d.prefix === prefix && d.suffix === suffix && d.version === version
		);

		if (deployment) {
			this.deployments.delete(suffix);
			const index = this.subscriptionDeploys.findIndex(d => d.deploy === suffix);
			if (index !== -1) {
				this.subscriptionDeploys.splice(index, 1);
			}
			return Promise.resolve(`Deployment ${suffix} deleted successfully`);
		}

		return Promise.reject(new Error(`Deployment ${suffix} not found`));
	}

	validateToken(): Promise<boolean> {
		return Promise.resolve(true);
	}

	refreshToken(): Promise<string> {
		return Promise.resolve(`mock-token-${Math.random().toString(36).substring(2, 15)}`);
	}

	deployEnabled(): Promise<boolean> {
		return Promise.resolve(true);
	}
}

