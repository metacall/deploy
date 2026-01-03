import { LogType } from '@metacall/protocol/deployment';
import { Plans } from '@metacall/protocol/plan';
import { Command, Option } from 'clipanion';
import { Listr } from 'listr2';
import { DeploymentConfigBuilder } from '../../builders/DeploymentConfigBuilder';
import { getDefaultWorkdir } from '../../constants/app.constants';
import { ForceDeploymentService } from '../../services/deployment/ForceDeploymentService';
import { PlanService } from '../../services/plan/PlanService';
import { DeploymentContext } from '../../strategies/DeploymentContext';
import { PackageDeploymentStrategy } from '../../strategies/PackageDeploymentStrategy';
import { RepositoryDeploymentStrategy } from '../../strategies/RepositoryDeploymentStrategy';
import { DeploymentResult } from '../../types/DeploymentResult';
import { IProtocolService } from '../../types/service.types';
import { selectContainer } from '../../ui/prompts';
import { getDefaultProjectName } from '../../utils/fileUtils';
import { RunnerToDisplayName } from '../../utils/languageUtils';
import { isInteractive } from '../../utils/ttyUtils';
import { BaseClipanionCommand } from './BaseClipanionCommand';

export class DeployCommand extends BaseClipanionCommand {
	static paths = [['deploy']];

	static usage = Command.Usage({
		category: 'Deployment',
		description: 'Deploy a package or repository to MetaCall FaaS',
		details: `
			Deploy your application to MetaCall FaaS platform.
			You can deploy either from a local directory or from a Git repository.
			
			For local deployments, specify --workdir with the path to your application.
			For repository deployments, specify --repo with the Git repository URL.
		`,
		examples: [
			['Deploy a Node.js app from current directory', 'metacall-deploy deploy --workdir . --name my-node-app'],
			['Deploy a Python app from specific directory', 'metacall-deploy deploy --workdir ./src/python-app --name my-python-app'],
			['Deploy from GitHub repository', 'metacall-deploy deploy --repo https://github.com/username/my-repo.git --name my-repo-app'],
			['Deploy with Premium plan', 'metacall-deploy deploy --workdir ./app --name my-app --plan Premium'],
			['Replace existing deployment', 'metacall-deploy deploy --workdir ./app --name my-app --force'],
			['Deploy to development environment', 'metacall-deploy deploy --workdir ./app --name my-app --dev'],
			['Test deployment without API calls', 'metacall-deploy deploy --workdir ./app --name my-app --mock']
		]
	});

	workdir = Option.String('--workdir', {
		description: 'Path to application directory'
	});

	repo = Option.String('--repo', {
		description: 'Git repository URL'
	});

	name = Option.String('--name', {
		description: 'Project name'
	});

	plan = Option.String('--plan', {
		description: 'Subscription plan'
	});

	force = Option.Boolean('--force', false, {
		description: 'Force deployment'
	});

	dev = Option.Boolean('--dev', false, {
		description: 'Use development server'
	});

	async execute(): Promise<number> {
		const context = await this.buildContext();

		if (!context.config.token && !process.env.METACALL_API_KEY && !this.mock && process.env.METACALL_MOCK_MODE !== 'true') {
			this.getLogger().error('Not authenticated. Please run "metacall-deploy login" first.');
			return 1;
		}

		try {
			const protocolClient = this.createProtocolService(context, this.dev);

			const workdir = this.workdir || getDefaultWorkdir();
			const projectName = this.name || getDefaultProjectName(workdir);

			let selectedPlan: Plans | undefined = this.plan as Plans | undefined;

			if (this.force) {
				const forceService = new ForceDeploymentService(protocolClient);
				const suffix = this.repo
					? this.repo.split('com/')[1]?.split('/').join('-') || projectName.toLowerCase()
					: projectName.toLowerCase();

				const existingPlan = await forceService.forceDeploy(suffix);
				if (existingPlan) {
					selectedPlan = existingPlan;
					this.getLogger().info('Deleted existing deployment, using plan from existing deployment.');
				}
			}

			if (!selectedPlan) {
				const planService = new PlanService(protocolClient);
				const availability = await planService.checkPlanAvailability();
				if (!availability.available) {
					this.getLogger().error(availability.message || 'No plans available');
					return 1;
				}
				selectedPlan = await planService.selectPlan(this.plan as Plans | undefined);
			}

			const builder = new DeploymentConfigBuilder()
				.withForce(this.force)
				.withDev(this.dev)
				.withPlan(selectedPlan);

			if (this.workdir || !this.repo) {
				builder.withWorkdir(workdir);
			}

			if (this.repo) {
				builder.withRepo(this.repo);
			}

			builder.withName(projectName);

			const config = builder.build();

			const strategy = this.repo ? new RepositoryDeploymentStrategy() : new PackageDeploymentStrategy();

			const deploymentContext = new DeploymentContext(strategy, config, protocolClient);

			const tasks = new Listr(
				[
					{
						title: 'Validating deployment configuration',
						task: async () => {
							const validation = await strategy.validate(deploymentContext);
							if (!validation.valid) {
								const errorMessage = validation.errors?.join(', ') || 'Unknown validation error';
								throw new Error(`Validation failed: ${errorMessage}`);
							}
						}
					},
					{
						title: 'Preparing deployment',
						task: async () => {
							await strategy.prepare(deploymentContext);
						}
					},
					{
						title: 'Deploying to MetaCall',
						task: async (ctx: {
							deploymentResult?: DeploymentResult;
							strategy?: PackageDeploymentStrategy | RepositoryDeploymentStrategy;
						}) => {
							const result = await deploymentContext.deploy();
							ctx.deploymentResult = result;
							ctx.strategy = strategy;
						}
					}
				],
				{
					concurrent: false,
					exitOnError: true,
					renderer: isInteractive() ? 'default' : 'silent'
				}
			);

			const ctx: {
				deploymentResult?: DeploymentResult;
				strategy?: PackageDeploymentStrategy | RepositoryDeploymentStrategy;
			} = {};
			await tasks.run(ctx);

			const result = ctx.deploymentResult;
			if (!result) {
				throw new Error('Deployment failed: No result returned');
			}

			this.getLogger().info(`Deployment ${result.deploymentId} created successfully`);

			if (isInteractive() && result.deploymentId) {
				const deploymentStrategy = ctx.strategy || strategy;
				let runners: string[];
				if (deploymentStrategy instanceof PackageDeploymentStrategy) {
					runners = await this.getRunnersFromPackage(config.workdir || workdir);
				} else if (deploymentStrategy instanceof RepositoryDeploymentStrategy) {
					runners = deploymentStrategy.getRunners();
				} else {
					runners = [];
				}

				if (runners.length > 0) {
					await this.showLogsAfterDeployment(protocolClient, result.deploymentId, runners, this.dev);
				}
			}

			this.getLogger().info('Use command "metacall-deploy inspect" to know more about deployment');

			return 0;
		} catch (error) {
			if (error instanceof Error) {
				this.getLogger().error(`Deployment failed: ${error.message}`);
			} else {
				this.getLogger().error('Deployment failed');
			}
			return 1;
		}
	}

	private async getRunnersFromPackage(workdir: string): Promise<string[]> {
		try {
			const { generatePackage } = await import('@metacall/protocol/package');
			const descriptor = await generatePackage(workdir);
			return descriptor.runners || [];
		} catch {
			return [];
		}
	}

	private async showLogsAfterDeployment(
		client: IProtocolService,
		deploymentId: string,
		runners: string[],
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_dev: boolean
	): Promise<void> {
		try {
			const deployments = await client.inspect();
			const deployment = deployments.find(d => d.suffix === deploymentId);

			if (!deployment) {
				return;
			}

			const prefix = deployment.prefix;
			const suffix = deployment.suffix;
			const version = deployment.version || 'v1';

			const containerChoices = [
				...runners.map(runner => ({
					name: RunnerToDisplayName(runner),
					value: runner
				})),
				{
					name: 'Deploy',
					value: 'deploy'
				}
			];

			const container = await selectContainer(containerChoices, 'Select a container to get logs');

			const logType = container === 'deploy' ? LogType.Deploy : LogType.Job;

			await this.showLogs(client, container, suffix, prefix, version, logType);
		} catch (error) {
			this.getLogger().debug(`Failed to show logs: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private async showLogs(
		client: IProtocolService,
		container: string,
		suffix: string,
		prefix: string,
		version: string,
		type: LogType
	): Promise<void> {
		this.getLogger().info(`Getting ${type} logs for ${suffix}...`);

		let logsTill: string[] = [''];
		let status = 'create';

		while (status !== 'ready') {
			const deployments = await client.inspect();
			const deployment = deployments.find(d => d.suffix === suffix);

			if (!deployment) {
				throw new Error(`Deployment ${suffix} not found`);
			}

			status = deployment.status;

			try {
				const allLogs = await client.logs(container, type, suffix, prefix, version);

				const logger = this.getLogger();
				allLogs.split('\n').forEach(line => {
					if (line && !logsTill.includes(line)) {
						logger.info(line);
					}
				});

				logsTill = allLogs.split('\n');
			} catch {
				// eslint-disable-next-line no-empty
			}

			if (status !== 'ready') {
				await new Promise(resolve => setTimeout(resolve, 10000));
			}
		}
	}
}
