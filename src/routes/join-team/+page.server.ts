import { createTeamSchema } from '$lib/schemas';

import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async () => {
	return { createTeamForm: await superValidate(zod(createTeamSchema)) };
};
