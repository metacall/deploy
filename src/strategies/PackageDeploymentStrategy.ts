import { MetaCallJSON } from '@metacall/protocol/deployment';
import { generatePackage, PackageError } from '@metacall/protocol/package';
import { API as APIInterface, ResourceType } from '@metacall/protocol/protocol';
import { promises as fs } from 'fs';
import { DeploymentError } from '../errors/CLIError';
import { DeploymentResult } from '../types/DeploymentResult';
import { ValidationResult } from '../types/ValidationResult';
import { PackageWizard } from '../ui/PackageWizard';
import { getEnv } from '../utils/envUtils';
import { getLogger } from '../utils/logger';
import { isInteractive } from '../utils/ttyUtils';
import { zip } from '../utils/zipUtils';
import { DeploymentContext } from './DeploymentContext';
import { IDeploymentStrategy } from '../types/strategy.types';

export class PackageDeploymentStrategy implements IDeploymentStrategy {
	private packageId?: string;
	private additionalJsons: MetaCallJSON[] = [];

	async validate(context: DeploymentContext): Promise<ValidationResult> {
		const config = context.getConfig();

		if (!config.workdir) {
			return {
				valid: false,
				errors: ['Workdir is required for package deployment']
			};
		}

		try {
			const stat = await fs.stat(config.workdir);
			if (!stat.isDirectory()) {
				return {
					valid: false,
					errors: [`${config.workdir} is not a directory`]
				};
			}
		} catch (error) {
			return {
				valid: false,
				errors: [`Directory ${config.workdir} not found`]
			};
		}

		return { valid: true };
	}

	async prepare(context: DeploymentContext): Promise<void> {
		const config = context.getConfig();

		if (!config.workdir) {
			throw new DeploymentError('Workdir is required for package deployment');
		}

		const descriptor = await generatePackage(config.workdir);

		switch (descriptor.error) {
			case PackageError.None:
				this.additionalJsons = [];
				break;

			case PackageError.Empty:
				throw new DeploymentError(`The directory you specified (${config.workdir}) is empty.`);

			case PackageError.JsonNotFound:
				if (isInteractive()) {
					getLogger().warn(`No metacall.json was found in ${config.workdir}, launching the wizard...`);
					const wizard = new PackageWizard();
					const result = await wizard.createJsonsAndDeploy(descriptor.files, config.workdir);

					if (result.shouldSave) {
						await generatePackage(config.workdir);
						this.additionalJsons = [];
						return;
					} else {
						this.additionalJsons = result.packages;
					}
				} else {
					throw new DeploymentError(
						`No metacall.json found in ${config.workdir} and running in non-interactive mode.`
					);
				}
				break;
		}
	}

	async deploy(context: DeploymentContext): Promise<DeploymentResult> {
		const config = context.getConfig();

		if (!config.workdir) {
			throw new DeploymentError('Workdir is required for package deployment');
		}

		const api = context.getApiClient();

		const name = config.name.toLowerCase();

		const descriptor = await generatePackage(config.workdir);

		const archive = await zip(config.workdir, descriptor.files);

		const packageId = await api.upload(name, archive, this.additionalJsons, descriptor.runners);

		this.packageId = packageId;

		const env = await getEnv(config.workdir);

		getLogger().info(`Deploying ${config.workdir}...\n`);

		// Use the underlying API client for deploy (matching deprecated CLI behavior)
		const apiClient: APIInterface = api.getApiClient ? api.getApiClient() : (api as unknown as APIInterface);
		const deploymentResult = (await apiClient.deploy(name, env, config.plan, ResourceType.Package)) as {
			suffix: string;
			prefix: string;
			version: string;
		};

		return {
			deploymentId: deploymentResult.suffix || packageId,
			name: config.name,
			status: 'pending',
			data: deploymentResult
		};
	}

	getPackageId(): string | undefined {
		return this.packageId;
	}
}
