import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

// postgres.js has built in connection pooling
export function createDb(databaseUrl: string) {
	const queryClient = postgres(databaseUrl, { max: 20 });
	return drizzle({ client: queryClient, schema });
}

export type Db = ReturnType<typeof createDb>;
export { schema };
