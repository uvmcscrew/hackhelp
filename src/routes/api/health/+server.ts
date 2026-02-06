import { testSMTPConnection } from '$lib/email';
import db from '$lib/server/db';

export const GET = async () => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
	const smtpstatus = await testSMTPConnection();
	if (!smtpstatus) {
		return new Response('SMTP Check Failed', { status: 503 });
	}
	// Simple query to check database connectivity
	const _configs = await db.client.select().from(db.schema.configuration);
	if (_configs.length < 1) {
		console.log('Database Check Failed');
		console.log(_configs);
		return new Response('Database Check Failed', { status: 503 });
	}
	return new Response('OK', { status: 200 });
};
