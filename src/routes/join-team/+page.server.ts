import { createTeamSchema } from '$lib/schemas';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';

import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { trpcCreateCaller } from '$lib/trpc/server/index.js';
import { createCallerContext } from '$lib/trpc/server/context.js';

export const load = (async () => {
	return { createTeamForm: await superValidate(zod(createTeamSchema)) };
}) satisfies PageServerLoad;

export const actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(createTeamSchema));
		if (!form.valid) {
			return fail(400, {
				createTeamForm: form
			});
		}

		try {
			await trpcCreateCaller(createCallerContext(event)).competitor.team.create(form.data);
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
