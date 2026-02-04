import { createOrpcContext } from '$lib/orpc/server/context';
import { appRouter } from '$lib/orpc/server/router';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (event: ServerLoadEvent) => {
	// Reject unauthenticated users
	if (!event.locals.auth.session) {
		return redirect(302, '/login');
	}

	// Redirect users who are not verified
	if (!(event.locals.auth.user.role ?? '').split(',').includes('verifiedUser')) {
		return redirect(302, '/account');
	}

	// Check if event pages are allowed to be viewed
	const showPages = await appRouter.config.viewPublic.allowAccessToEventPages.callable({
		context: createOrpcContext(event)
	})();

	if (!showPages) {
		return redirect(302, '/account');
	}

	return {
		authData: event.locals.auth
	};
};
