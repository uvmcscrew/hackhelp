import { env as runtimeEnv } from '$env/dynamic/public';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const clientEnv = createEnv({
	client: {},
	clientPrefix: 'PUBLIC_',
	runtimeEnv,
	emptyStringAsUndefined: true
});
