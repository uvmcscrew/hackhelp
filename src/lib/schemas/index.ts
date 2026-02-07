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

export const personProfileRole = z.enum(['competitor', 'mentor', 'judge', 'admin']);
export type PersonProfileRole = z.infer<typeof personProfileRole>;

export const profileDataSchema = z.object({
	shirtSize: z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']).optional(),
	mainlineDietaryRestrictions: z.object({
		halal: z.boolean().default(false),
		kosher: z.boolean().default(false),
		vegan: z.boolean().default(false),
		vegetarian: z.boolean().default(false),
		peanuts: z.boolean().default(false),
		eggs: z.boolean().default(false),
		fish: z.boolean().default(false),
		shellfish: z.boolean().default(false),
		wheat: z.boolean().default(false),
		treenuts: z.boolean().default(false),
		soy: z.boolean().default(false),
		glutenFree: z.boolean().default(false)
	}),
	otherAllergies: z.string().optional()
});

export type ProfileData = z.infer<typeof profileDataSchema>;
