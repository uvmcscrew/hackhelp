import { createAuthClient } from 'better-auth/svelte';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from './server.server';
import {
	adminClient,
	emailOTPClient,
	magicLinkClient,
	genericOAuthClient,
	lastLoginMethodClient,
	usernameClient
} from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';
import { ac, roles } from './permissions';
import { queryOptions, type QueryClient } from '@tanstack/svelte-query';

export const authClient = createAuthClient({
	plugins: [
		inferAdditionalFields<typeof auth>(),
		usernameClient(),
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

export const sessionQueryOptions = queryOptions({
	queryKey: ['auth', 'user'],
	queryFn: () => authClient.getSession().then((r) => r.data)
});

export async function signOutAndClearCache(qc: QueryClient) {
	await authClient.signOut();
	await qc.cancelQueries({});
	await qc.invalidateQueries({ queryKey: sessionQueryOptions.queryKey });
	qc.clear();
}
