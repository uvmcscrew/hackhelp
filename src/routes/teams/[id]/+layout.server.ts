import { createOrpcContext } from '$lib/orpc/server/context';
import { appRouter } from '$lib/orpc/server/router';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const context = await createOrpcContext(event);

	return {
		team: await appRouter.teams.byId.callable({ context })({ id: event.params.id })
	};
};
