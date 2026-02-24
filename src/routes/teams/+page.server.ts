import { createOrpcContext } from '$lib/orpc/server/context';
import { appRouter } from '$lib/orpc/server/router';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	const context = await createOrpcContext(event);
	return {
		allTeams: await appRouter.teams.listAll.callable({ context })()
	};
}) satisfies PageServerLoad;
