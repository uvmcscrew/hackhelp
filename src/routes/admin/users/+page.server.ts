import { trpcCreateCaller } from '$lib/trpc/server';
import { createCallerContext } from '$lib/trpc/server/context';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (event: ServerLoadEvent) => {
	if (!event.locals.user) {
		return redirect(302, '/auth/login');
	}

	return trpcCreateCaller(createCallerContext(event)).admin.users.all();
};
