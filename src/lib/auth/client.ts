import { createAuthClient } from 'better-auth/svelte';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import type { auth } from './server';

const authClient = createAuthClient({
	plugins: [inferAdditionalFields<typeof auth>()]
});

export const { signIn, signUp, useSession } = authClient;
