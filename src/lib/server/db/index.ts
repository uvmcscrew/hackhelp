import { DATABASE_URL } from '$app/env/private';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '#lib/server/db/schema';

// postgres.js has built in connection pooling
const queryClient = postgres(DATABASE_URL, { max: 20 });
export const db = drizzle({ client: queryClient, schema });

export default { client: db, schema };
