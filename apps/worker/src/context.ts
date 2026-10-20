import { createDb, type Db } from '@hackhelp/db';
import { createEmailClient, type EmailClient } from '@hackhelp/emails';
import { buildConnection, type QueueConnection } from '@hackhelp/queue';

/**
 * Everything job processors may need at execution time. Handlers receive this
 * as their first argument; extend it as new job domains need more services.
 */
export type WorkerContext = {
	db: Db;
	email: EmailClient;
};

function required(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

/** Redis connection for workers; the queue package never reads env itself. */
export function redisConnection(): QueueConnection {
	return buildConnection(required('REDIS_URL'));
}

export function createContext(): WorkerContext {
	const db = createDb(required('DATABASE_URL'));
	const email = createEmailClient({
		smtpUrl: required('SMTP_URL'),
		from: required('SMTP_FROM')
	});
	return { db, email };
}
