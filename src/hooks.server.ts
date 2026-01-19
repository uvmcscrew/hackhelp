import { auth } from '$lib/auth/server'; // path to your auth file
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Fetch current session from Better Auth
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	// Make session and user available on server
	if (session) {
		event.locals.auth = {
			session: session.session,
			user: session.user
		};
	} else {
		event.locals.auth = {
			session: null,
			user: null
		};
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
