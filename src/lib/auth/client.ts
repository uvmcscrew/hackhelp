import { createAuthClient } from 'better-auth/svelte';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth, AuthData } from './server';
import {
	adminClient,
	emailOTPClient,
	magicLinkClient,
	genericOAuthClient,
	lastLoginMethodClient
} from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';
import { ac, roles } from './permissions';
import { createQuery } from '@tanstack/svelte-query';

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

export const { signIn, signUp, signOut, ...authClient } = __authClient;

export function useSession(initialData?: AuthData) {
	return createQuery(() => ({
		queryKey: ['user'],
		queryFn: () => authClient.getSession().then((s) => s.data),
		initialData
	}));
}
