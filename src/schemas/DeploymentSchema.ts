import { z } from 'zod';
import { Plans } from '@metacall/protocol/plan';

export const DeploymentConfigSchema = z
	.object({
		workdir: z.string().optional(),
		repo: z.string().url().optional(),
		name: z.string().min(1).max(50),
		plan: z.nativeEnum(Plans),
		force: z.boolean().default(false),
		env: z.record(z.string()).optional(),
		dev: z.boolean().default(false)
	})
	.refine(data => data.workdir || data.repo, {
		message: 'Either workdir or repo must be provided',
		path: ['workdir']
	});

export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;
