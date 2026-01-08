import { IProtocolService } from '../../types/service.types';
import { DeploymentConfig } from '../../schemas/DeploymentSchema';
import { DeploymentResult } from '../../types/DeploymentResult';
import { DeploymentError } from '../../errors/CLIError';
import { DeploymentVerificationService } from './DeploymentVerificationService';
import { generatePackage, PackageError } from '@metacall/protocol/package';
import { promises as fs } from 'fs';
import { isDirectory, exists } from '../../utils/fileUtils';
import { MetaCallJSON } from '@metacall/protocol/deployment';
import { Archiver } from 'archiver';

export class DeploymentService {
	private readonly verificationService: DeploymentVerificationService;

	constructor(private readonly protocolService: IProtocolService) {
		this.verificationService = new DeploymentVerificationService(protocolService);
	}

	async validateProject(config: DeploymentConfig): Promise<void> {
		if (config.workdir) {
			if (!(await exists(config.workdir))) {
				throw new DeploymentError(`Directory ${config.workdir} not found`);
			}

			if (!(await isDirectory(config.workdir))) {
				throw new DeploymentError(`${config.workdir} is not a directory`);
			}

			const files = await fs.readdir(config.workdir);
			if (files.length === 0) {
				throw new DeploymentError(`Directory ${config.workdir} is empty`);
			}
		}
	}

	async generatePackage(config: DeploymentConfig): Promise<ReturnType<typeof generatePackage>> {
		if (!config.workdir) {
			throw new DeploymentError('Workdir is required for package generation');
		}

		const descriptor = await generatePackage(config.workdir);

		if (descriptor.error === PackageError.Empty) {
			throw new DeploymentError(`Directory ${config.workdir} is empty`);
		}

		return descriptor;
	}

	async uploadPackage(
		config: DeploymentConfig,
		archive: Archiver | Buffer,
		additionalJsons: MetaCallJSON[],
		runners: string[]
	): Promise<string> {
		const name = config.name.toLowerCase();
		return await this.protocolService.upload(name, archive, additionalJsons, runners);
	}

	async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
		try {
			const result = await this.protocolService.deploy(config);
			return {
				deploymentId: result.suffix || 'unknown',
				name: config.name,
				status: 'pending',
				data: result
			};
		} catch (error) {
			if (error instanceof Error) {
				throw new DeploymentError(`Deployment failed: ${error.message}`, undefined, error);
			}
			throw error;
		}
	}

	async verifyDeployment(deploymentId: string, timeout = 300000): Promise<DeploymentResult> {
		return this.verificationService.verify(deploymentId, timeout);
	}
}
