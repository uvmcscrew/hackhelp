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
import type { Db } from '@hackhelp/db';
import type { OTPEmailProps, MagicLinkEmailProps } from '@hackhelp/emails';
import { ac, roles } from './permissions';

export * from './permissions';

export type AuthEnv = {
	authSecret: string;
	baseUrl: string;
	github: {
		clientId: string;
		clientSecret: string;
	};
	uvmNetid: {
		clientId: string;
		clientSecret: string;
		discoveryUrl: string;
	};
};

export type AuthEmailHandlers = {
	sendEmailOtp: (to: string, emailProps: OTPEmailProps) => Promise<unknown>;
	sendMagicLinkEmail: (to: string, emailProps: MagicLinkEmailProps) => Promise<unknown>;
};

export type CreateAuthOptions = {
	db: Db;
	env: AuthEnv;
	email: AuthEmailHandlers;
};

type UVMEntraProfile = {
	id: string;
	email: string;
	name: string;
	preferred_username: string;
};

export function createAuth({ db, env, email: emailHandlers }: CreateAuthOptions) {
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: 'pg'
		}),
		secret: env.authSecret,
		baseURL: env.baseUrl,
		advanced: {
			ipAddress: {
				ipAddressHeaders: ['cf-connecting-ip', 'x-real-ip', 'x-forwarded-for']
			}
		},
		user: {
			additionalFields: {
				teamId: {
					type: 'string',
					required: false,
					defaultValue: null,
					input: false
				}
			}
		},
		account: {
			accountLinking: {
				enabled: true,
				allowDifferentEmails: true,
				trustedProviders: ['github', 'uvm-netid']
			}
		},
		socialProviders: {
			github: {
				clientId: env.github.clientId,
				clientSecret: env.github.clientSecret,
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
						await emailHandlers.sendEmailOtp(email, { type, otp });
					}
				}
			}),
			magicLink({
				sendMagicLink: async ({ email: to, url }) => {
					await emailHandlers.sendMagicLinkEmail(to, { magicLink: url });
				}
			}),
			genericOAuth({
				config: [
					{
						providerId: 'uvm-netid',
						clientId: env.uvmNetid.clientId,
						clientSecret: env.uvmNetid.clientSecret,
						discoveryUrl: env.uvmNetid.discoveryUrl,
						overrideUserInfo: true,
						mapProfileToUser: (profile) => {
							const uvmProfile = profile as unknown as UVMEntraProfile;
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
		]
	});
}
