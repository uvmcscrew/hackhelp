import { trpcCreateCaller } from '$lib/trpc/server';
import { createCallerContext } from '$lib/trpc/server/context';
import { error, type ServerLoadEvent } from '@sveltejs/kit';
import { TRPCError } from '@trpc/server';

export const load = async (event: ServerLoadEvent) => {
	if (event.params.teamId === undefined) {
		return error(404);
	}

	try {
		const res = await  trpcCreateCaller(createCallerContext(event)).admin.teams.getById({
			teamId: event.params.teamId
		});
		return { teamRes: res };
	} catch (e) {
		if (e instanceof TRPCError) {
			if (e.code === 'NOT_FOUND') {
				return error(404);
			}
		} else {
			return error(500);
		}
	}
};
