import { z } from 'zod';

export const ConfigSchema = z.object({
	baseURL: z.string().url(),
	apiURL: z.string().url(),
	devURL: z.string().url(),
	renewTime: z.number().positive(),
	token: z.string().optional()
});

export type Config = z.infer<typeof ConfigSchema>;
