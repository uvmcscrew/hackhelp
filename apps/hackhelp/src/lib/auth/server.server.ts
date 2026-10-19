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
import { sendEmailOtp, sendMagicLinkEmail } from '#lib/email';
import { createAuth, type MLHUserProfile } from '@hackhelp/auth';

export type { MLHUserProfile };

export const auth = createAuth({
	db,
	env: {
		authSecret: AUTH_SECRET,
		baseUrl: BASE_URL,
		github: {
			clientId: GITHUB_APP_CLIENT_ID,
			clientSecret: GITHUB_APP_CLIENT_SECRET
		},
		uvmNetid: {
			clientId: UVM_NETID_OIDC_CLIENT_ID,
			clientSecret: UVM_NETID_OIDC_CLIENT_SECRET,
			discoveryUrl: UVM_NETID_OIDC_DISCOVERY_URL
		},
		mlh: {
			clientId: MLH_OAUTH_CLIENT_ID,
			clientSecret: MLH_OAUTH_CLIENT_SECRET
		}
	},
	email: {
		sendEmailOtp,
		sendMagicLinkEmail
	}
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
