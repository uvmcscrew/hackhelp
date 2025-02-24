import { z } from 'zod';

export const createTeamSchema = z.object({
	name: z.string().nonempty().min(3).max(50),
	description: z.string().default('')
});
