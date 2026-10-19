import { DATABASE_URL } from '$app/env/private';
import { createDb } from '@hackhelp/db';
import * as dbSchema from '@hackhelp/db/schema';

// postgres.js has built in connection pooling
export const db = createDb(DATABASE_URL);

export * from '@hackhelp/db/schema';

export default { client: db, schema: dbSchema };
