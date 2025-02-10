import { serverEnv } from '$lib/env/server';
import type { RequestEvent } from './$types';
import { Webhooks } from '@octokit/webhooks';

const webhooks = new Webhooks({
	secret: serverEnv.GITHUB_WEBHOOK_SECRET
});

export async function POST(event: RequestEvent) {
	const signature = event.request.headers.get('x-hub-signature-256');

	if (!signature) {
		return new Response(null, {
			status: 400,
			statusText: 'Bad Request'
		});
	}

	if (!(await webhooks.verify(await event.request.text(), signature))) {
		return new Response(null, {
			status: 401,
			statusText: 'Unauthorized'
		});
	}

	return new Response(null, {
		status: 202
	});
}
