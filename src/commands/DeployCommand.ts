import { BaseCommand } from './base/BaseCommand';
import { CommandContext } from '../types/CommandContext';
import { CommandResult } from '../types/CommandResult';
import { DeploymentContext } from '../strategies/DeploymentContext';
import { IDeploymentStrategy } from '../types/strategy.types';
import { DeploymentConfigBuilder } from '../builders/DeploymentConfigBuilder';
import { Plans } from '@metacall/protocol/plan';

export class DeployCommand extends BaseCommand {
	constructor(context: CommandContext, private readonly strategy: IDeploymentStrategy) {
		super(context);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async execute(_context: CommandContext): Promise<CommandResult> {
		const config = new DeploymentConfigBuilder().withName('default-name').withPlan(Plans.Essential).build();

		const deploymentContext = new DeploymentContext(this.strategy, config);

		try {
			const result = await deploymentContext.deploy();

			return {
				exitCode: 0,
				message: `Deployment ${result.deploymentId} created successfully`,
				data: result
			};
		} catch (error) {
			if (error instanceof Error) {
				return {
					exitCode: 2,
					message: `Deployment failed: ${error.message}`
				};
			}
			return {
				exitCode: 2,
				message: 'Deployment failed'
			};
		}
	}
}
