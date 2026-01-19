import { building } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const serverEnv = createEnv({
	server: {
		DATABASE_URL: z.string().nonempty(),
		GITHUB_APP_ID: z.coerce.number().int().positive(),
		GITHUB_APP_PRIVATE_KEY: z.string().nonempty(),
		GITHUB_APP_CLIENT_ID: z.string().nonempty(),
		GITHUB_APP_CLIENT_SECRET: z.string().nonempty(),
		GITHUB_WEBHOOK_SECRET: z.base64().nonempty(),
		SMTP_URL: z.string(),
		UVM_NETID_OIDC_CLIENT_ID: z.string(),
		UVM_NETID_OIDC_CLIENT_SECRET: z.string(),
		UVM_NETID_OIDC_DISCOVERY_URL: z.string()
	},
	client: {
		PUBLIC_GITHUB_ORGNAME: z.string().nonempty(),
		PUBLIC_SMTP_FROM: z.email()
	},
	clientPrefix: 'PUBLIC_',
	runtimeEnv: { ...privateEnv, ...publicEnv },
	skipValidation: building,
	// runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true
});
