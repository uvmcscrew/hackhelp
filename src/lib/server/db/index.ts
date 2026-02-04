import { serverEnv } from '$lib/env/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '$lib/server/db/schema';

// postgres.js has built in connection pooling
const queryClient = postgres(serverEnv.DATABASE_URL, { max: 20 });
export const db = drizzle({ client: queryClient, schema });

export default { client: db, schema };
