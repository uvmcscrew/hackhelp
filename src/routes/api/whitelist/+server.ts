import type { RequestEvent } from './$types';
import { z } from 'zod';
import { batchWhitelistSchema } from '$lib/schemas';
import { db, schema } from '$lib/server/db';
import { serverEnv } from '$lib/env/server';
import { fail } from '@sveltejs/kit';

const whitelistBodySchema = z.object({
	authToken: z.string().nonempty(),
	users: z.array(batchWhitelistSchema)
});

export async function POST(event: RequestEvent) {
	let bodyValidated: z.infer<typeof whitelistBodySchema>;
	try {
		bodyValidated = await whitelistBodySchema.parseAsync(await event.request.json());
	} catch (e) {
		console.log((e as Error).message);
		return fail(400, { message: 'Invalid request body' });
	}
	if (bodyValidated.authToken !== serverEnv.WHITELIST_ENDPOINT_TOKEN) {
		return fail(401, { message: 'Not authorized' });
	}

	const { users } = bodyValidated;

	for (const user of users) {
		await db
			.insert(schema.profile)
			.values({
				givenName: `${user.firstName} ${user.lastName}`,
				email: user.email,
				username: user.githubUsername,
				isWhitelisted: true,
				isBanned: false,
				role: 'competitor'
			})
			.onConflictDoUpdate({
				target: schema.profile.username,
				set: {
					username: user.githubUsername.toLowerCase(),
					givenName: `${user.firstName} ${user.lastName}`,
					email: user.email,
					isWhitelisted: true,
					isBanned: false,
					role: 'competitor'
				}
			});
	}

	return Response.json({ message: 'Whitelist updated' });
}
