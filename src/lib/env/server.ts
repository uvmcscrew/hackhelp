import { env as runtimeEnv } from '$env/dynamic/private';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const serverEnv = createEnv({
	server: {
		DATABASE_URL: z.string().nonempty(),
		GITHUB_APP_ID: z.coerce.number().int().positive(),
		GITHUB_APP_INSTALL_ID: z.coerce.number().int().positive(),
		GITHUB_APP_PRIVATE_KEY: z.string().nonempty(),
		GITHUB_APP_CLIENT_ID: z.string().nonempty(),
		GITHUB_APP_CLIENT_SECRET: z.string().nonempty()
	},
	runtimeEnv,
	emptyStringAsUndefined: true
});
