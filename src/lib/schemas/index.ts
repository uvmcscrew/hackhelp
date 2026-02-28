import { mapValues } from 'es-toolkit/object';
import { z } from 'zod';

export const createTeamSchema = z.object({
	name: z.string().nonempty().min(3).max(50),
	description: z.string().default('')
});

export const createTicketSchema = z.object({
	title: z.string().nonempty().max(100),
	repository: z.string().nonempty(),
	issueNumber: z.coerce.number().int().positive()
});

export const personProfileRole = z.enum(['competitor', 'mentor', 'judge', 'admin']);
export type PersonProfileRole = z.infer<typeof personProfileRole>;

export const dietaryRestrictions = {
	halal: 'Halal',
	kosher: 'Kosher',
	vegan: 'Vegan',
	vegetarian: 'Vegetarian',
	peanuts: 'Peanuts',
	eggs: 'Eggs',
	fish: 'Fish',
	shellfish: 'Shellfish',
	wheat: 'Wheat',
	treenuts: 'Tree Nuts',
	soy: 'Soy',
	glutenFree: 'Gluten Free'
} as const;

export const shirtSizes = {
	xs: 'Extra Small',
	sm: 'Small',
	md: 'Medium',
	lg: 'Large',
	xl: 'Extra Large',
	'2xl': '2X Large',
	'3xl': '3X Large'
} as const;

export const profileDataSchema = z.object({
	shirtSize: z.enum(Object.keys(shirtSizes)).optional(),
	mainlineDietaryRestrictions: z.object(
		mapValues(dietaryRestrictions, () => z.boolean().default(false))
	),
	otherAllergies: z.string().optional()
});

export type ProfileData = z.infer<typeof profileDataSchema>;
