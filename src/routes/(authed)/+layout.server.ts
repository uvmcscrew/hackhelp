import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = (event: ServerLoadEvent) => {
	// Reject unauthenticated users
	if (!event.locals.auth.session) {
		return redirect(302, '/login');
	}
	return {
		authData: event.locals.auth
	};
};
