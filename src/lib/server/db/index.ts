import { serverEnv } from '$lib/env/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const queryClient = postgres(serverEnv.DATABASE_URL);
export const db = drizzle({ client: queryClient });

export * as schema from '$lib/server/db/schema';
