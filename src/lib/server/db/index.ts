import { serverEnv } from '$lib/env/server';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

// In-memory Postgres
const client = new PGlite(serverEnv.DATABASE_URL);
export const db = drizzle({ client });

export * as schema from '$lib/server/db/schema';
