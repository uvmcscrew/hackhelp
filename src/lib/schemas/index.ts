import { WORK_ROOMS } from '$lib/utils';
import { z } from 'zod';

export const createTeamSchema = z.object({
	name: z.string().nonempty().min(3).max(50),
	description: z.string().default('')
});

export const createTicketSchema = z.object({
	title: z.string().nonempty().max(100),
	location: z.enum(WORK_ROOMS),
	locationDescription: z.string().max(280),
	repository: z.string().nonempty(),
	issueNumber: z.coerce.number().int().positive()
});

export const batchWhitelistSchema = z.object({
	firstName: z.string().nonempty(),
	lastName: z.string().nonempty(),
	email: z.string().email(),
	githubUsername: z.string().nonempty()
});

export type BatchWhitelist = z.infer<typeof batchWhitelistSchema>;
