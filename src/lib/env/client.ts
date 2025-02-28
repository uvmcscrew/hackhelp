import { building } from '$app/environment';
import { env as runtimeEnv } from '$env/dynamic/public';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const clientEnv = createEnv({
	client: {
		PUBLIC_GITHUB_ORGNAME: z.string().nonempty(),
		PUBLIC_SHOW_CHALLENGES: z.coerce.boolean().default(true)
	},
	clientPrefix: 'PUBLIC_',
	runtimeEnv,
	emptyStringAsUndefined: true,
	skipValidation: building
});
