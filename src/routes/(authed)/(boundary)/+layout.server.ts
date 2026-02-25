import { createOrpcContext } from '$lib/orpc/server/context';
import { appRouter } from '$lib/orpc/server/router';
import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoadEvent } from './$types';

export const load = async (event: LayoutServerLoadEvent) => {
	// Reject unauthenticated users
	if (!event.locals.auth.session) {
		return redirect(302, '/login');
	}

	// Redirect users who are not verified
	if (!(event.locals.auth.user.role ?? '').split(',').includes('verifiedUser')) {
		return error(400, 'You are not permitted to view event pages');
	}

	// Check if event pages are allowed to be viewed
	const showPages = await appRouter.config.viewPublic.allowAccessToEventPages.callable({
		context: createOrpcContext(event)
	})();

	if (!showPages) {
		return error(400, 'You are not allowed to see this yet. Check back soon!');
	}

	return {
		authData: event.locals.auth
	};
};
