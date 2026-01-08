import { findRunners } from '@metacall/protocol/package';
import { API as APIInterface, ResourceType } from '@metacall/protocol/protocol';
import { DeploymentError } from '../errors/CLIError';
import { DeploymentResult } from '../types/DeploymentResult';
import { IDeploymentStrategy } from '../types/strategy.types';
import { ValidationResult } from '../types/ValidationResult';
import { selectFromList } from '../ui/prompts';
import { getEnv } from '../utils/envUtils';
import { getLogger } from '../utils/logger';
import { isInteractive } from '../utils/ttyUtils';
import { DeploymentContext } from './DeploymentContext';

export class RepositoryDeploymentStrategy implements IDeploymentStrategy {
	private repositoryId?: string;
	private selectedBranch?: string;
	private runners: string[] = [];

	validate(context: DeploymentContext): Promise<ValidationResult> {
		return Promise.resolve(
			(() => {
				const config = context.getConfig();

				if (!config.repo) {
					return {
						valid: false,
						errors: ['Repository URL is required for repository deployment']
					};
				}

				try {
					new URL(config.repo);
				} catch {
					return {
						valid: false,
						errors: [`Invalid repository URL: ${config.repo}`]
					};
				}

				return { valid: true };
			})()
		);
	}

	async prepare(context: DeploymentContext): Promise<void> {
		const config = context.getConfig();

		if (!config.repo) {
			throw new DeploymentError('Repository URL is required for repository deployment');
		}

		const api = context.getApiClient();

		const branchListResult = await api.branchList(config.repo);
		const branches = branchListResult.branches || [];

		if (!branches || branches.length === 0) {
			throw new DeploymentError('Invalid Repository URL - no branches found');
		}

		if (branches.length === 1) {
			this.selectedBranch = branches[0];
			const branchName = this.selectedBranch || 'unknown';
			getLogger().info(`Only one branch found: ${branchName}, Selecting it automatically.`);
		} else {
			if (isInteractive()) {
				this.selectedBranch = await selectFromList(branches, 'Select branch:');
			} else {
				throw new DeploymentError('Multiple branches found. Please specify branch in non-interactive mode.');
			}
		}

		const files = await api.fileList(config.repo, this.selectedBranch);

		this.runners = Array.from(findRunners(files));
	}

	async deploy(context: DeploymentContext): Promise<DeploymentResult> {
		const config = context.getConfig();

		if (!config.repo || !this.selectedBranch) {
			throw new DeploymentError('Repository URL and branch are required for repository deployment');
		}

		const api = context.getApiClient();

		const addResponse = await api.add(config.repo, this.selectedBranch, []);
		this.repositoryId = addResponse.id;

		const env = await getEnv();

		getLogger().info('Deploying...');

		// Use the underlying API client for deploy (matching deprecated CLI behavior)
		const apiClient: APIInterface = api.getApiClient ? api.getApiClient() : (api as unknown as APIInterface);
		const deployment = (await apiClient.deploy(this.repositoryId, env, config.plan, ResourceType.Repository)) as {
			suffix: string;
			prefix: string;
			version: string;
		};

		return {
			deploymentId: deployment.suffix || this.repositoryId,
			name: config.name,
			status: 'pending',
			data: deployment
		};
	}

	getRepositoryId(): string | undefined {
		return this.repositoryId;
	}

	getRunners(): string[] {
		return this.runners;
	}
}
