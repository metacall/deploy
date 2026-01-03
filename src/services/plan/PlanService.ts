import { Plans } from '@metacall/protocol/plan';
import { IProtocolService } from '../../types/service.types';
import { selectPlan } from '../../ui/prompts';

export class PlanService {
	constructor(private readonly protocolService: IProtocolService) {}

	async getAvailablePlans(): Promise<Record<string, number>> {
		const subscriptions = await this.protocolService.listSubscriptions();
		return subscriptions;
	}

	async checkPlanAvailability(): Promise<{
		available: boolean;
		message?: string;
	}> {
		const availPlans = await this.getAvailablePlans();

		if (!Object.keys(availPlans).length) {
			const deployedApps = await this.protocolService.listSubscriptionsDeploys();

			if (!deployedApps.length) {
				return {
					available: false,
					message:
						'There are no active plans associated with your account. Please purchase a new plan at https://dashboard.metacall.io.'
				};
			} else {
				return {
					available: false,
					message:
						'Every plan on your account has apps installed on it. A new plan can be purchased at https://dashboard.metacall.io.'
				};
			}
		}

		return { available: true };
	}

	async selectPlan(requestedPlan?: Plans): Promise<Plans> {
		const availPlans = await this.getAvailablePlans();
		const planKeys = Object.keys(availPlans);

		if (!planKeys.length) {
			const check = await this.checkPlanAvailability();
			throw new Error(check.message || 'No plans available');
		}

		if (requestedPlan && planKeys.includes(requestedPlan)) {
			return requestedPlan;
		}

		if (planKeys.length === 1) {
			return planKeys[0] as Plans;
		}

		return await selectPlan(planKeys, 'Please select plan from the list');
	}

	async getSubscriptionDeploys(): Promise<Array<{ deploy: string; plan: Plans }>> {
		return await this.protocolService.listSubscriptionsDeploys();
	}
}
