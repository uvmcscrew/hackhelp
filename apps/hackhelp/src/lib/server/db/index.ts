import { DATABASE_URL } from '$app/env/private';
import { createDb } from '@hackhelp/db';
import * as dbSchema from '@hackhelp/db/schema';
import postgres from 'postgres';
import { createOTELEmitter } from 'otel-instrumentation-postgres';
import { instrumentDrizzleClient } from '@kubiks/otel-drizzle';

const rawClient = postgres(DATABASE_URL, { max: 20 });
const instrumentedClient = createOTELEmitter(rawClient);
export const db = createDb(instrumentedClient);

instrumentDrizzleClient(db, {
	dbSystem: 'postgresql',
	captureQueryText: true
});

export * from '@hackhelp/db/schema';

export default { client: db, schema: dbSchema };
