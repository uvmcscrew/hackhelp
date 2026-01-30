import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = (event: ServerLoadEvent) => {
	if (!event.locals.user) {
		return redirect(302, '/auth/login');
	}

	if (!event.locals.user.isOrgMember) {
		return redirect(302, '/account');
	}

	if (!event.locals.user.isOrgAdmin) {
		return redirect(302, '/home');
	}

	return {
		user: event.locals.user
	};
};
