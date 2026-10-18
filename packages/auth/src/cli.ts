import { createDb } from '@hackhelp/db';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createAuth } from './index';

// The repository keeps a single .env at the monorepo root; load it explicitly
// because the CLI may run with a different working directory.
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

// Entry point for the @better-auth/cli schema generator.
// Runs outside of SvelteKit, so environment variables come straight from
// process.env (bun automatically loads them from the root .env).
export const auth = createAuth({
	db: createDb(process.env.DATABASE_URL ?? ''),
	env: {
		authSecret: process.env.AUTH_SECRET ?? 'schema-generation-placeholder',
		baseUrl: process.env.BASE_URL ?? 'http://localhost:5173',
		github: {
			clientId: process.env.GITHUB_APP_CLIENT_ID ?? '',
			clientSecret: process.env.GITHUB_APP_CLIENT_SECRET ?? ''
		},
		uvmNetid: {
			clientId: process.env.UVM_NETID_OIDC_CLIENT_ID ?? '',
			clientSecret: process.env.UVM_NETID_OIDC_CLIENT_SECRET ?? '',
			discoveryUrl: process.env.UVM_NETID_OIDC_DISCOVERY_URL ?? ''
		},
		mlh: {
			clientId: process.env.MLH_OAUTH_CLIENT_ID ?? '',
			clientSecret: process.env.MLH_OAUTH_CLIENT_SECRET ?? ''
		}
	},
	email: {
		sendEmailOtp: () =>
			Promise.reject(new Error('Email sending is stubbed during schema generation')),
		sendMagicLinkEmail: () =>
			Promise.reject(new Error('Email sending is stubbed during schema generation'))
	}
});
