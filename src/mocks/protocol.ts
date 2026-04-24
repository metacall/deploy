/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { API as APIInterface } from '@metacall/protocol/protocol';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

type DeployResponse = {
	id: string;
	prefix: string;
	suffix: string;
	version: string;
	status: string;
};

type Deployment = {
	id: string;
	prefix: string;
	suffix: string;
	version: string;
	status: 'create' | 'ready' | 'failed';
	packages?: Record<string, any>;
};

type Subscription = {
	Essential: number;
	Professional: number;
	Premium: number;
};

// Path to shared deployments store file
const getDeploymentsPath = (): string => {
	return join(homedir(), '.metacall-deploy-test-state.json');
};

// Load deployments from shared file
const loadDeployments = (): Deployment[] => {
	const path = getDeploymentsPath();
	try {
		if (existsSync(path)) {
			const data = readFileSync(path, 'utf-8');
			return JSON.parse(data) as Deployment[];
		}
	} catch (e) {
		// If file doesn't exist or can't be parsed, return empty array
	}
	return [];
};

// Save deployments to shared file
const saveDeployments = (deployments: Deployment[]): void => {
	const path = getDeploymentsPath();
	try {
		writeFileSync(path, JSON.stringify(deployments, null, 2), 'utf-8');
	} catch (e) {
		// Silently fail if can't write
	}
};

export default function mockAPI(token: string, baseURL: string): APIInterface {
	void baseURL; // May be used for future implementations
	void token; // Mocks always succeed

	const mockAPI: {
		validate(): Promise<boolean>;
		refresh(): Promise<string>;
		inspect(): Promise<Deployment[]>;
		upload(): Promise<{ id: string }>;
		deploy(name: string): Promise<DeployResponse>;
		deployDelete(
			prefix: string,
			suffix: string,
			version: string
		): Promise<string>;
		add(
			url: string,
			branch: string,
			runners: string[]
		): Promise<{ id: string }>;
		branchList(url: string): Promise<{ branches: string[] }>;
		fileList(url: string, branch: string): Promise<unknown[]>;
		listSubscriptions(): Promise<Subscription>;
		listSubscriptionsDeploys(): Promise<Deployment[]>;
		logs(): Promise<string>;
	} = {
		validate(): Promise<boolean> {
			return Promise.resolve(true);
		},

		refresh(): Promise<string> {
			return Promise.resolve(`${token}_refreshed`);
		},

		inspect(): Promise<Deployment[]> {
			return Promise.resolve(
				loadDeployments().map(d => ({
					...d,
					packages: {}
				}))
			);
		},

		upload(): Promise<{ id: string }> {
			return Promise.resolve({ id: 'mock-upload-id' });
		},

		deploy(name: string): Promise<DeployResponse> {
			const deployments = loadDeployments();

			const deployment: Deployment = {
				id: `mock-${Date.now()}`,
				prefix: 'mock',
				suffix: name,
				version: `${Date.now()}`,
				status: 'ready'
			};

			deployments.push(deployment);
			saveDeployments(deployments);

			return Promise.resolve(deployment);
		},

		deployDelete(
			prefix: string,
			suffix: string,
			version: string
		): Promise<string> {
			const deployments = loadDeployments();

			const index = deployments.findIndex(
				d =>
					d.prefix === prefix &&
					d.suffix === suffix &&
					d.version === version
			);

			if (index === -1) {
				throw new Error('No deployment found');
			}

			deployments.splice(index, 1);
			saveDeployments(deployments);

			return Promise.resolve('Deploy Delete Succeed');
		},

		add(
			url: string,
			branch: string,
			runners: string[]
		): Promise<{ id: string }> {
			return Promise.resolve({ id: 'mock-add-id' });
		},

		branchList(url: string): Promise<{ branches: string[] }> {
			return Promise.resolve({ branches: ['main'] });
		},

		fileList(url: string, branch: string): Promise<unknown[]> {
			return Promise.resolve([]);
		},

		listSubscriptions(): Promise<Subscription> {
			return Promise.resolve({
				Essential: 1,
				Professional: 0,
				Premium: 0
			});
		},

		listSubscriptionsDeploys(): Promise<Deployment[]> {
			const deployments = loadDeployments();
			return Promise.resolve(deployments);
		},

		logs(): Promise<string> {
			return Promise.resolve('');
		}
	};

	return mockAPI as unknown as APIInterface;
}
