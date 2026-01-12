import type { RequestEvent } from './$types';
import { appRouter } from '$lib/orpc/server/router';
import { createOrpcContext } from '$lib/orpc/server/context';

export async function GET(event: RequestEvent) {
	const { url } = await appRouter.auth.getOAuthUrlMutation.callable({
		context: createOrpcContext(event)
	})();

	return new Response(null, {
		status: 302,
		headers: {
			Location: url
		}
	});
}
