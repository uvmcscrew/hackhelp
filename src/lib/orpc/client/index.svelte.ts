import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { createORPCClient, onError } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '../server';
import { browser, dev } from '$app/environment';

const ORPC_PATH = '/api/rpc' as const;

const ORPC_URL = browser
	? ORPC_PATH
	: dev
		? `http://localhost:5173${ORPC_PATH}`
		: `https://hackhelp.unicycl.ing${ORPC_PATH}`;

const link = new RPCLink({
	url: ORPC_URL,
	interceptors: [
		onError((error) => {
			console.error(error);
		})
	]
});

const client: RouterClient<AppRouter> = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
