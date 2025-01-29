import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { serverEnv } from '$lib/env/server';
const client = new Database(serverEnv.DATABASE_URL);
client.pragma('journal_mode = WAL');
export const db = drizzle(client);

export * as schema from '$lib/server/db/schema';
