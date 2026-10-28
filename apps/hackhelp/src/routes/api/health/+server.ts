import { checkRedisConnection } from '@hackhelp/queue';
import db from '#lib/server/db';

export const GET = async () => {
	const redisStatus = await checkRedisConnection();
	if (!redisStatus) {
		return new Response('Redis Check Failed', { status: 503 });
	}
	const _configs = await db.client.select().from(db.schema.configuration);
	if (_configs.length < 1) {
		console.log('Database Check Failed');
		console.log(_configs);
		return new Response('Database Check Failed', { status: 503 });
	}
	return new Response('OK', { status: 200 });
};
