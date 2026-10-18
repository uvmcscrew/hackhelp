import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

// The repository keeps a single .env at the monorepo root; load it explicitly
// so drizzle-kit also works when invoked from inside packages/db.
config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
	schema: './src/schema.ts',

	dbCredentials: {
		url: process.env.DATABASE_URL
	},

	verbose: true,
	strict: true,
	dialect: 'postgresql'
});
