import { z } from 'zod';

export const createTeamSchema = z.object({
	name: z.string().nonempty(),
	description: z.string().default('')
});
