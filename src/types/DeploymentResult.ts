export interface DeploymentResult {
	deploymentId: string;

	name: string;

	status: 'pending' | 'ready' | 'fail';

	message?: string;

	data?: unknown;
}
