import { WORK_ROOMS } from '$lib/utils';
import { z } from 'zod';

export const createTeamSchema = z.object({
	name: z.string().nonempty().min(3).max(50),
	description: z.string().default('')
});

export const createTicketSchema = z.object({
	title: z.string().nonempty().min(3).max(100),
	location: z.enum(WORK_ROOMS),
	locationDescription: z.string().default('')
});
