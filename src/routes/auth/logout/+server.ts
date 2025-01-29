import { type RequestEvent, fail, redirect } from '@sveltejs/kit';
import { invalidateSession, deleteSessionTokenCookie } from '$lib/server/auth';

export async function POST(event: RequestEvent) {
	if (event.locals.session === null) {
		return fail(401);
	}
	await invalidateSession(event.locals.session.id);
	deleteSessionTokenCookie(event);
	return redirect(302, '/auth/login');
}
