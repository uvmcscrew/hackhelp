import { serverEnv } from '$lib/env/server';
import { db } from '$lib/server/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { passkey } from '@better-auth/passkey';
import {
	emailOTP,
	magicLink,
	admin,
	genericOAuth,
	lastLoginMethod,
	username
} from 'better-auth/plugins';
import { sendEmailOtp, sendMagicLinkEmail } from '$lib/email';
import { ac, roles } from './permissions';

type UVMEntraProfile = {
	id: string;
	email: string;
	name: string;
	preferred_username: string;
};

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	secret: serverEnv.AUTH_SECRET,
	baseURL: serverEnv.BASE_URL,
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ['github', 'uvm-netid']
		}
	},
	socialProviders: {
		github: {
			clientId: serverEnv.GITHUB_APP_CLIENT_ID,
			clientSecret: serverEnv.GITHUB_APP_CLIENT_SECRET,
			disableImplicitSignUp: true,
			disableSignUp: true
		}
	},
	plugins: [
		username(),
		passkey(),
		emailOTP({
			async sendVerificationOTP({ email, otp, type }) {
				if (type === 'forget-password') {
					throw new Error('Passwords not enabled');
				} else {
					await sendEmailOtp(email, { type, otp });
				}
			}
		}),
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				await sendMagicLinkEmail(email, { magicLink: url });
			}
		}),
		genericOAuth({
			config: [
				{
					providerId: 'uvm-netid',
					clientId: serverEnv.UVM_NETID_OIDC_CLIENT_ID,
					clientSecret: serverEnv.UVM_NETID_OIDC_CLIENT_SECRET,
					discoveryUrl: serverEnv.UVM_NETID_OIDC_DISCOVERY_URL,
					overrideUserInfo: true,
					mapProfileToUser: (profile) => {
						const uvmProfile = profile as UVMEntraProfile;
						return {
							name: uvmProfile.name,
							username: uvmProfile.preferred_username.split('@')[0],
							email: uvmProfile.email
						};
					}
				}
			]
		}),
		admin({
			ac,
			roles
		}),
		lastLoginMethod()
	],
	experimental: { joins: true }
});

export type AuthData = typeof auth.$Infer.Session;
export type User = AuthData['user'];
export type Session = AuthData['session'];
