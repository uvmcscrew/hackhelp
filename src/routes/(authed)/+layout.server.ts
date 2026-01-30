import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = (event: ServerLoadEvent) => {
	if (!event.locals.auth.session) {
		return redirect(302, '/login');
	}

	if (!(event.locals.auth.user.role ?? '').split(',').includes('verifiedUser')) {
		return redirect(302, '/account');
	}

	return {
		authData: event.locals.auth
	};
};
