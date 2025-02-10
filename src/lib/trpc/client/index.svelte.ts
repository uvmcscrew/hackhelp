import { createTRPCProxyClient, httpBatchLink, loggerLink } from '@trpc/client';
import type { AppRouter } from '../server';
import superjson from 'superjson';
import { browser, dev } from '$app/environment';

const TRPC_PATH = '/api/trpc' as const;

const TRPC_URL = browser
	? TRPC_PATH
	: dev
		? `http://localhost:5173${TRPC_PATH}`
		: `https://hackhelp.unicycl.ing${TRPC_PATH}`;

export const trpcClient = createTRPCProxyClient<AppRouter>({
	transformer: superjson,
	links: [
		httpBatchLink({
			url: TRPC_URL,
			fetch
		}),
		loggerLink({ enabled: () => dev })
	]
});
