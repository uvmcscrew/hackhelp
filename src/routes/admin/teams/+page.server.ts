import { trpcCreateCaller } from '$lib/trpc/server';
import { createCallerContext } from '$lib/trpc/server/context';
import { type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (event: ServerLoadEvent) => {
	return trpcCreateCaller(createCallerContext(event)).admin.teams.all();
};
