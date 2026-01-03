import { Plans } from '@metacall/protocol/plan';
import { ValidationError } from '../errors/CLIError';
import { DeploymentConfig, DeploymentConfigSchema } from '../schemas/DeploymentSchema';

export class DeploymentConfigBuilder {
	private config: Partial<DeploymentConfig> = {};

	withWorkdir(path: string): this {
		this.config.workdir = path;
		return this;
	}

	withRepo(url: string): this {
		this.config.repo = url;
		return this;
	}

	withName(name: string): this {
		this.config.name = name;
		return this;
	}

	withPlan(plan: Plans): this {
		this.config.plan = plan;
		return this;
	}

	withEnvironment(env: Record<string, string>): this {
		this.config.env = env;
		return this;
	}

	withForce(force: boolean): this {
		this.config.force = force;
		return this;
	}

	withDev(dev: boolean): this {
		this.config.dev = dev;
		return this;
	}

	build(): DeploymentConfig {
		try {
			return DeploymentConfigSchema.parse(this.config);
		} catch (error) {
			if (error instanceof Error) {
				throw new ValidationError(`Invalid deployment configuration: ${error.message}`, error);
			}
			throw error;
		}
	}
}
