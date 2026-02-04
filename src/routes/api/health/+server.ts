import db from '$lib/server/db';

export const GET = async () => {
	// Simple query to check database connectivity
	const _configs = await db.client.select().from(db.schema.configuration).limit(1);
	return new Response('OK', { status: 200 });
};
