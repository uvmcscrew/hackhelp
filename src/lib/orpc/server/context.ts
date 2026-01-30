import db from '$lib/server/db';
import { githubApp } from '$lib/github';
import type { Cookies } from '@sveltejs/kit';
import { logger } from '$lib/logger';
import type { AuthLocals } from '../../../app';

export type ContextGeneratorParams = {
	request: Request;
	locals: { auth: AuthLocals };
	cookies: Cookies;
};

export type Context = Awaited<ReturnType<typeof createOrpcContext>>;

export type AuthedContext = Context & {
	user: NonNullable<AuthLocals['user']>;
	session: NonNullable<AuthLocals['session']>;
};

export function createOrpcContext(opts: ContextGeneratorParams) {
	return {
		req: opts.request,
		...opts.locals.auth,
		db,
		githubApp,
		cookies: opts.cookies,
		logger: logger.child({ requestId: opts.request.headers.get('x-railway-request-id') })
	};
}
