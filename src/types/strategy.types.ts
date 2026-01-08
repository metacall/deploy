import { DeploymentContext } from '../strategies/DeploymentContext';
import { DeploymentResult } from './DeploymentResult';
import { ValidationResult } from './ValidationResult';

export interface IDeploymentStrategy {
	deploy(context: DeploymentContext): Promise<DeploymentResult>;

	validate(context: DeploymentContext): Promise<ValidationResult>;

	prepare(context: DeploymentContext): Promise<void>;
}
