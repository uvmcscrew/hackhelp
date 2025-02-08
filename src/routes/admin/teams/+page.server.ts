import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const load = (async (event) => {
	if (!event.locals.user || !event.locals.user.isAdmin) {
		return fail(403);
	}

	const dbTeams = await db
		.select()
		.from(schema.team)
		.leftJoin(schema.user, eq(schema.user.teamId, schema.team.id));

	return { teams: dbTeams };
}) satisfies PageServerLoad;
