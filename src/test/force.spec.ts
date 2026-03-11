/**
 * Unit tests for src/force.ts
 *
 * Fixes: https://github.com/metacall/deploy/issues #208
 * "force() exits with error when no existing deployment matches the target suffix"
 *
 * All tests use a mock API, no network or real credentials required.
 */

import { Deployment, DeployStatus } from '@metacall/protocol/deployment';
import { Plans } from '@metacall/protocol/plan';
import {
	API as APIInterface,
	SubscriptionDeploy
} from '@metacall/protocol/protocol';
import { strictEqual } from 'assert';
import { basename } from 'path';
import args from '../cli/args';
import { force } from '../force';

// force() derives the suffix from args['projectName'].toLowerCase() when
// --addrepo is not set. Mirror that here so mock data aligns with the filter.
const TEST_SUFFIX = basename(process.cwd()).toLowerCase();

const makeDeployment = (): Deployment => ({
	status: 'ready' as DeployStatus,
	prefix: 'test-prefix',
	suffix: TEST_SUFFIX,
	version: 'v1',
	packages: {} as Deployment['packages'],
	ports: []
});

const makeSubscriptionDeploy = (): SubscriptionDeploy => ({
	id: 'sub-id-abc123',
	plan: Plans.Essential,
	date: Date.now(),
	deploy: TEST_SUFFIX
});

// Only the three methods force() actually invokes are given real stubs.
// Everything else resolves to a safe empty value.
const makeMockApi = (
	deployments: Deployment[],
	subscriptionDeploys: SubscriptionDeploy[]
): APIInterface => ({
	refresh: () => Promise.resolve(''),
	validate: () => Promise.resolve(true),
	deployEnabled: () => Promise.resolve(true),
	listSubscriptions: () => Promise.resolve({}),
	listSubscriptionsDeploys: () => Promise.resolve(subscriptionDeploys),
	inspect: () => Promise.resolve(deployments),
	upload: () => Promise.resolve(''),
	add: () => Promise.resolve({ id: '' }),
	deploy: () => Promise.resolve({ suffix: '', prefix: '', version: '' }),
	deployDelete: () => Promise.resolve('deleted-ok'),
	logs: () => Promise.resolve(''),
	branchList: () => Promise.resolve({ branches: ['main'] }),
	fileList: () => Promise.resolve([])
});

describe('Unit force() emptyrepo guard', () => {
	const originalPlan = args['plan'];

	afterEach(() => {
		args['plan'] = originalPlan;
	});

	it('returns empty string and does not throw when no deployment exists', async () => {
		const api = makeMockApi([], []);
		const result = await force(api);
		strictEqual(result, '');
	});

	it('deletes the existing deployment and restores args.plan from subscription', async () => {
		const api = makeMockApi([makeDeployment()], [makeSubscriptionDeploy()]);
		const result = await force(api);

		strictEqual(result, 'deleted-ok');
		strictEqual(args['plan'], Plans.Essential);
	});

	it('deletes deployment without crashing when subscription list has no match', async () => {
		const api = makeMockApi([makeDeployment()], []);
		const result = await force(api);

		// Deletion succeeds; args.plan stays unchanged since no subscription matched.
		strictEqual(result, 'deleted-ok');
		strictEqual(args['plan'], originalPlan);
	});
});
