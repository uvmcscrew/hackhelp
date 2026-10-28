import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

import * as schema from './schema';

export function createDb(databaseUrlOrClient: string | Sql) {
	const client =
		typeof databaseUrlOrClient === 'string'
			? postgres(databaseUrlOrClient, { max: 20 })
			: databaseUrlOrClient;
	return drizzle({ client, schema });
}

export type Db = ReturnType<typeof createDb>;
export { schema };
