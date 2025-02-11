import type { RequestEvent } from './$types';
import { createCallerContext } from '$lib/trpc/server/context';
import { trpcCreateCaller } from '$lib/trpc/server';

export async function GET(event: RequestEvent) {
	const trpc = trpcCreateCaller(createCallerContext(event));

	const { url } = await trpc.auth.getOAuthUrl();

	return new Response(null, {
		status: 302,
		headers: {
			Location: url
		}
	});
}
