import db from '$lib/server/db';
import { githubApp } from '$lib/github';
import type { Cookies } from '@sveltejs/kit';
import { logger } from '$lib/logger';
import type { User, Session } from '$lib/auth/server';

export type ContextGeneratorParams = {
	request: Request;
	locals:
		| {
				user: User;
				session: Session;
		  }
		| {
				user: null;
				session: null;
		  };
	cookies: Cookies;
};

export type Context = Awaited<ReturnType<typeof createOrpcContext>>;

export function createOrpcContext(opts: ContextGeneratorParams) {
	return {
		req: opts.request,
		...opts.locals,
		db,
		githubApp,
		cookies: opts.cookies,
		logger: logger.child({ requestId: opts.request.headers.get('x-railway-request-id') })
	};
}
