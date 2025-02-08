import { appRouter } from '$lib/trpc/server';
import { createContextFunc } from '$lib/trpc/server/context';
import type { RequestHandler } from './$types';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

export const fallback = (async (opts) => {
	return fetchRequestHandler({
		endpoint: '/trpc',
		req: opts.request,
		router: appRouter,
		createContext: createContextFunc(opts)
	});
}) satisfies RequestHandler;
