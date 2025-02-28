import { serverEnv } from './src/lib/env/server';
import { readFile } from 'fs/promises';

import { batchWhitelistSchema } from './src/lib/schemas';
import { z } from 'zod';

const file = await readFile('./whitelist.json', 'utf-8');

const whitelistRaw = JSON.parse(file);

const whitelistBodySchema = z.object({
	users: z.array(batchWhitelistSchema)
});

const whitelist = await whitelistBodySchema.parseAsync(whitelistRaw);

const ENDPOINT_URL = 'https://hackhelp.unicycl.ing/api/whitelist';

await fetch(ENDPOINT_URL, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json'
	},
	body: JSON.stringify({
		authToken: serverEnv.WHITELIST_ENDPOINT_TOKEN,
		users: whitelist.users
	})
});
