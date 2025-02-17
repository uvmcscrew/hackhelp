import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (event: ServerLoadEvent) => {
	if (!event.locals.user) {
		return redirect(302, '/auth/login');
	}

	// user can only be here if they are not in a team
	if (event.locals.user.teamId !== null) {
		return redirect(302, '/home');
	}

	return {
		user: event.locals.user
	};
};
