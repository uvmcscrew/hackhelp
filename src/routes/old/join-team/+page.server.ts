import { createTeamSchema } from '$lib/schemas';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';

import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { appRouter } from '$lib/orpc/server/router/index.js';
import { createOrpcContext } from '$lib/orpc/server/context.js';

export const load = (async () => {
	return { createTeamForm: await superValidate(zod4(createTeamSchema)) };
}) satisfies PageServerLoad;

export const actions = {
	create: async (event) => {
		const form = await superValidate(event, zod4(createTeamSchema));
		if (!form.valid) {
			return fail(400, {
				createTeamForm: form
			});
		}

		try {
			await appRouter.competitor.team.create.callable({ context: createOrpcContext(event) })(
				form.data
			);
		} catch (e) {
			const error = e as Error;

			return fail(400, {
				createTeamForm: form,
				error: error.message
			});
		}

		return redirect(302, '/home');
	}
} satisfies Actions;
