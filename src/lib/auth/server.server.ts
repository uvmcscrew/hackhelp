import {
	AUTH_SECRET,
	BASE_URL,
	GITHUB_APP_CLIENT_ID,
	GITHUB_APP_CLIENT_SECRET,
	UVM_NETID_OIDC_CLIENT_ID,
	UVM_NETID_OIDC_CLIENT_SECRET,
	UVM_NETID_OIDC_DISCOVERY_URL,
	MLH_OAUTH_CLIENT_ID,
	MLH_OAUTH_CLIENT_SECRET
} from '$app/env/private';
import { db } from '#lib/server/db';
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
import { sendEmailOtp, sendMagicLinkEmail } from '#lib/email';
import { ac, roles } from './permissions';

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

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg'
	}),
	secret: AUTH_SECRET,
	baseURL: BASE_URL,
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
			clientId: GITHUB_APP_CLIENT_ID,
			clientSecret: GITHUB_APP_CLIENT_SECRET,
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
					clientId: UVM_NETID_OIDC_CLIENT_ID,
					clientSecret: UVM_NETID_OIDC_CLIENT_SECRET,
					discoveryUrl: UVM_NETID_OIDC_DISCOVERY_URL,
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
					clientId: MLH_OAUTH_CLIENT_ID,
					clientSecret: MLH_OAUTH_CLIENT_SECRET,
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

export type AuthData = typeof auth.$Infer.Session;
export type User = AuthData['user'] & {
	role?: string | null;
	teamId?: string | null;
	username?: string | null;
	displayUsername?: string | null;
};
export type Session = AuthData['session'];
export type UserAccounts = Awaited<ReturnType<typeof auth.api.listUserAccounts>>;
