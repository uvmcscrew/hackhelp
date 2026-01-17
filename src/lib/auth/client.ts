import { createAuthClient } from 'better-auth/svelte';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from './server';
import {
	adminClient,
	emailOTPClient,
	magicLinkClient,
	genericOAuthClient,
	lastLoginMethodClient
} from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';
import { ac, roles } from './permissions';

const __authClient = createAuthClient({
	plugins: [
		inferAdditionalFields<typeof auth>(),
		passkeyClient(),
		emailOTPClient(),
		magicLinkClient(),
		genericOAuthClient(),
		lastLoginMethodClient(),
		adminClient({
			ac,
			roles
		})
	]
});

export const { signIn, signUp, signOut, useSession, ...authClient } = __authClient;
