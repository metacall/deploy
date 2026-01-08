import { Command, Option } from 'clipanion';
import { BaseClipanionCommand } from './BaseClipanionCommand';
import { PlanService } from '../../services/plan/PlanService';

export class PlansCommand extends BaseClipanionCommand {
	static paths = [['plans'], ['plans', 'list']];

	static usage = Command.Usage({
		category: 'Management',
		description: 'List available subscription plans',
		details: `
			Display available subscription plans and their available slots.
			Use --select to interactively select a plan.
		`,
		examples: [
			['View available subscription plans', 'metacall-deploy plans'],
			['List plans with available slots', 'metacall-deploy plans list'],
			['Choose a plan from interactive menu', 'metacall-deploy plans --select']
		]
	});

	select = Option.Boolean('--select', false, {
		description: 'Select a plan interactively'
	});

	async execute(): Promise<number> {
		const context = await this.buildContext();

		try {
			const client = this.createProtocolService(context);

			const planService = new PlanService(client);

			if (this.select) {
				const selectedPlan = await planService.selectPlan();
				this.getLogger().info(`Selected plan: ${selectedPlan}`);
				return 0;
			}

			const availability = await planService.checkPlanAvailability();
			if (!availability.available) {
				this.getLogger().warn(availability.message || 'No plans available');
				return 0;
			}

			const plans = await planService.getAvailablePlans();
			const planKeys = Object.keys(plans);

			this.getLogger().info(`Found ${planKeys.length} plan(s):`);
			planKeys.forEach(plan => {
				this.getLogger().info(`  ${plan}: ${plans[plan]} available slot(s)`);
			});

			return 0;
		} catch (error) {
			if (error instanceof Error) {
				this.getLogger().error(`Failed to list plans: ${error.message}`);
			} else {
				this.getLogger().error('Failed to list plans');
			}
			return 1;
		}
	}
}
