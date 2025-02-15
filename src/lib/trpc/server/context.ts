import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { Session, User } from '$lib/server/db/schema';
import { db, schema } from '$lib/server/db';
import { githubApp } from '$lib/github';
import type { Cookies } from '@sveltejs/kit';
import { logger } from '$lib/logger';

export type ContextGeneratorParams = {
	request: Request;
	locals: {
		user: User | null;
		session: Session | null;
	};
	cookies: Cookies;
};

export type Context = Awaited<ReturnType<ReturnType<typeof createContextFunc>>>;

export function createContextFunc(sveltekitCtx: ContextGeneratorParams) {
	return async function ({ req }: FetchCreateContextFnOptions) {
		return {
			req,
			...sveltekitCtx.locals,
			db,
			dbSchema: schema,
			githubApp,
			cookies: sveltekitCtx.cookies,
			logger: logger.child({ requestId: req.headers.get('x-railway-request-id') })
		};
	};
}

export function createCallerContext(ctx: ContextGeneratorParams) {
	return {
		req: ctx.request,
		...ctx.locals,
		db,
		dbSchema: schema,
		githubApp,
		cookies: ctx.cookies,
		logger: logger.child({ requestId: ctx.request.headers.get('x-railway-request-id') })
	} satisfies Context;
}
