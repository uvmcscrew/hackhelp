import { createOrpcContext } from '$lib/orpc/server/context';
import { appRouter } from '$lib/orpc/server/router';
import { type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (event: ServerLoadEvent) => {
	return appRouter.admin.teams.getAll.callable({ context: createOrpcContext(event) })();
};
