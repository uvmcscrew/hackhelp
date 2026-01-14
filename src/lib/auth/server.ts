import { serverEnv } from '$lib/env/server';
import { db } from '$lib/server/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	socialProviders: {
		github: {
			clientId: serverEnv.GITHUB_APP_CLIENT_ID,
			clientSecret: serverEnv.GITHUB_APP_CLIENT_SECRET,
			disableImplicitSignUp: true,
			disableSignUp: true
		}
	},
	experimental: { joins: true }
});

export type AuthData = typeof auth.$Infer.Session;
export type User = AuthData['user'];
export type Session = AuthData['session'];
