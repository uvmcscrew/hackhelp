import { trpcCreateCaller } from '$lib/trpc/server';
import { createCallerContext } from '$lib/trpc/server/context';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	return {
		team: await trpcCreateCaller(createCallerContext(event)).competitor.team.get()
	};
}) satisfies PageServerLoad;
