import { createOrpcContext } from '$lib/orpc/server/context';
import { appRouter } from '$lib/orpc/server/router';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	return {
		team: await appRouter.competitor.team.getTeam.callable({ context: createOrpcContext(event) })()
	};
}) satisfies PageServerLoad;
