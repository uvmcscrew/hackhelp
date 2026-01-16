import { serverEnv } from '$lib/env/server';
import { db } from '$lib/server/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { passkey } from '@better-auth/passkey';
import { emailOTP, magicLink } from 'better-auth/plugins';
import { sendEmailOtp, sendMagicLinkEmail } from '$lib/email';

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
	plugins: [
		passkey(),
		emailOTP({
			async sendVerificationOTP({ email, otp, type }) {
				if (type === 'forget-password') {
					throw new Error('Passwords not enabled');
				} else {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-call
					await sendEmailOtp(email, { type, otp });
				}
			}
		}),
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await sendMagicLinkEmail(email, { magicLink: url });
			}
		})
	],
	experimental: { joins: true }
});

export type AuthData = typeof auth.$Infer.Session;
export type User = AuthData['user'];
export type Session = AuthData['session'];
