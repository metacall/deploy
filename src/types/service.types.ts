import { Deployment, LogType, MetaCallJSON } from '@metacall/protocol/deployment';
import { Plans } from '@metacall/protocol/plan';
import API from '@metacall/protocol/protocol';
import { DeploymentConfig } from '../schemas/DeploymentSchema';

export interface IProtocolService {
	deploy(config: DeploymentConfig): Promise<{
		suffix: string;
		prefix: string;
		version: string;
	}>;

	inspect(): Promise<Deployment[]>;

	inspectById(id: string): Promise<Deployment>;

	delete(id: string): Promise<void>;
	delete(prefix: string, suffix: string, version: string): Promise<void>;

	listSubscriptions(): Promise<Record<string, number>>;

	listSubscriptionsDeploys(): Promise<Array<{ deploy: string; plan: Plans }>>;

	upload(
		name: string,
		blob: Buffer | NodeJS.ReadableStream,
		jsons?: MetaCallJSON[],
		runners?: string[]
	): Promise<string>;

	add(url: string, branch: string, jsons?: MetaCallJSON[]): Promise<{ id: string }>;

	branchList(url: string): Promise<{ branches: string[] }>;

	fileList(url: string, branch: string): Promise<string[]>;

	logs(container: string, type: LogType, suffix: string, prefix: string, version?: string): Promise<string>;

	deployDelete(prefix: string, suffix: string, version?: string): Promise<string>;

	validateToken(): Promise<boolean>;

	refreshToken(): Promise<string>;

	deployEnabled(): Promise<boolean>;

	getApiClient?(): ReturnType<typeof API>;
}

export interface BackoffStrategy {
	wait(attempt: number): Promise<void>;
}
