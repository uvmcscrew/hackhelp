import { db, schema } from '$lib/server/db';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async (event: ServerLoadEvent) => {
	if (!event.locals.user) {
		return redirect(302, '/auth/login');
	}

	const [userStatus] = await db
		.select()
		.from(schema.userStatus)
		.where(eq(schema.userStatus.linkedUserId, event.locals.user.id));

	return {
		user: event.locals.user,
		userStatus
	};
};
