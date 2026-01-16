import { createAuthClient } from 'better-auth/svelte';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from './server';
import { adminClient, emailOTPClient, magicLinkClient } from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';
import { ac, roles } from './permissions';

const authClient = createAuthClient({
	plugins: [
		inferAdditionalFields<typeof auth>(),
		passkeyClient(),
		emailOTPClient(),
		magicLinkClient(),
		adminClient({
			ac,
			roles
		})
	]
});

export const { signIn, signUp, useSession } = authClient;
