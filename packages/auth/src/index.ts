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
	mlh: {
		clientId: string;
		clientSecret: string;
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

export type MLHUserProfile = {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	phone_number: string | null;
	profile: {
		country_of_residence: string | null;
		race_or_ethnicity: string | null;
		gender: string | null;
		age: number | null;
	} | null;
	education: Array<{
		id: string;
		current: boolean;
		school_name: string;
		school_type: string | null;
		start_date: number | null;
		end_date: number | null;
		major: string | null;
	}> | null;
};

export function createAuth({ db, env, email: emailHandlers }: CreateAuthOptions) {
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: 'pg'
		}),
		secret: env.authSecret,
		baseURL: env.baseUrl,
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
				trustedProviders: ['github', 'uvm-netid', 'mlh']
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
					},
					{
						providerId: 'mlh',
						clientId: env.mlh.clientId,
						clientSecret: env.mlh.clientSecret,
						authorizationUrl: 'https://my.mlh.io/oauth/authorize',
						tokenUrl: 'https://my.mlh.io/oauth/token',
						userInfoUrl: 'https://api.mlh.com/v4/users/me?expand[]=education',
						scopes: [
							'public',
							'offline_access',
							'user:read:profile',
							'user:read:education',
							'user:read:email',
							'user:read:event_preferences'
						],
						mapProfileToUser: (profile) => {
							const mlhProfile = profile as unknown as MLHUserProfile;
							return {
								name: `${mlhProfile.first_name} ${mlhProfile.last_name}`
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
