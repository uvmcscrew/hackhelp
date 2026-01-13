import { serverEnv } from '$lib/env/server';
import { logger } from '$lib/logger';
import { nanoid } from 'nanoid';
import type { RequestEvent } from './$types';
import { Webhooks } from '@octokit/webhooks';
import { updateInvitedUser } from '$lib/orpc/server/router';
import { db, schema } from '$lib/server/db';
import { githubApp } from '$lib/github';

let apiLogger = logger.child({
	route: '/api/webhook/github',
	method: 'POST'
});

const webhooks = new Webhooks({
	secret: serverEnv.GITHUB_WEBHOOK_SECRET,
	log: apiLogger
});

// Webhook event callbacks

webhooks.on('organization.member_added', async ({ id, payload }) => {
	apiLogger = apiLogger.child({
		reqId: id,
		webhookCallback: true
	});

	const username = payload.membership.user?.login;

	if (!username) {
		apiLogger.warn('No username provided', { error: 400 });
		return;
	}

	apiLogger.info('User added to organization', { username });

	// Update database
	try {
		await updateInvitedUser(username, { client: db, schema }, githubApp);
	} catch (e) {
		apiLogger.error('Error updating database', { error: 500, exception: e });
	}
});

// Webhook HTTP request handler
export async function POST(event: RequestEvent) {
	const signature = event.request.headers.get('x-hub-signature-256');
	const reqId = event.request.headers.get('x-railway-request-id') ?? nanoid();

	apiLogger = apiLogger.child({
		reqId
	});

	apiLogger.info('Received webhook', { signature });

	if (!signature) {
		apiLogger.warn('No signature provided', { error: 400 });
		return new Response(null, {
			status: 400,
			statusText: 'Bad Request'
		});
	}

	if (!(await webhooks.verify(await event.request.text(), signature))) {
		apiLogger.warn('Could not verify webhook', { error: 400 });
		return new Response(null, {
			status: 401,
			statusText: 'Unauthorized'
		});
	}

	apiLogger.info('Webhook verified');

	const ghEvent = event.request.headers.get('x-github-event');

	if (!ghEvent) {
		apiLogger.warn('No event provided', { error: 400 });
		return new Response(null, {
			status: 400,
			statusText: 'Bad Request'
		});
	}

	try {
		await webhooks.receive({
			id: reqId,
			// @ts-expect-error ghEvent is naturally untyped
			name: ghEvent,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			payload: await event.request.json()
		});
	} catch (e) {
		apiLogger.error('Error processing webhook', { error: 500, exception: e });
		return new Response(null, {
			status: 500,
			statusText: 'Internal Server Error'
		});
	}

	return new Response(null, {
		status: 202
	});
}
