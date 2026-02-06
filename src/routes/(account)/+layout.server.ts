import { auth } from '$lib/auth/server.server';
import { createOrpcContext } from '$lib/orpc/server/context';
import { appRouter } from '$lib/orpc/server/router';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (event: ServerLoadEvent) => {
	if (!event.locals.auth.user) {
		return redirect(302, '/login');
	}

	const context = await createOrpcContext(event);

	const headers = event.request.headers;

	return {
		userInitialData: event.locals.auth,
		accounts: await auth.api.listUserAccounts({
			headers
		}),
		shouldShowNavigationButtons: await appRouter.account.shouldShowNavigationButtons.callable({
			context
		})(),
		canCreateProfile: await appRouter.account.canCreateProfile.callable({ context })(),
		canRequestVerification: await appRouter.account.canRequestVerification.callable({ context })()
	};
};
