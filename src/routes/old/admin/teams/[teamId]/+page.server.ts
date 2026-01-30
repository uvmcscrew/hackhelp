import { createOrpcContext } from '$lib/orpc/server/context';
import { appRouter } from '$lib/orpc/server/router';
import { ORPCError } from '@orpc/client';
import { error, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (event: ServerLoadEvent) => {
	if (event.params.teamId === undefined) {
		return error(404);
	}

	try {
		const res = await appRouter.admin.teams.getById.callable({ context: createOrpcContext(event) })(
			{
				teamId: event.params.teamId
			}
		);

		return { teamRes: res };
	} catch (e) {
		if (e instanceof ORPCError) {
			if (e.code === 'NOT_FOUND') {
				return error(404);
			}
		} else {
			return error(500);
		}
	}
};
