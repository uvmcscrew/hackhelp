import { RPCHandler } from '@orpc/server/fetch';
import { onError } from '@orpc/server';
import type { RequestHandler } from './$types';
import { appRouter } from '$lib/orpc/server/router';
import { createOrpcContext } from '$lib/orpc/server/context';
import { CompressionPlugin } from '@orpc/server/fetch';
import { LoggingHandlerPlugin } from '@orpc/experimental-pino';
import pino from 'pino';
import { nanoid } from 'nanoid';

const logger = pino({
	transport: {
		target: 'pino-pretty'
	}
});

const handler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		})
	],
	plugins: [
		new CompressionPlugin(),
		new LoggingHandlerPlugin({
			logger,
			generateId: ({ request }) => request.headers['x-railway-request-id']?.toString() || nanoid()
		})
	]
});

const handle: RequestHandler = async (opts) => {
	const { response } = await handler.handle(opts.request, {
		prefix: '/api/rpc',
		context: await createOrpcContext(opts) // Provide initial context if needed
	});

	return response ?? new Response('Not Found', { status: 404 });
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
