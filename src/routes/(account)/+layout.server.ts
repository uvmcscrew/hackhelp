import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = (event: ServerLoadEvent) => {
	if (!event.locals.auth.user) {
		return redirect(302, '/login');
	}

	return {
		userInitialData: event.locals.auth
	};
};
