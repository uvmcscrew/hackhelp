import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { Session, User } from '$lib/server/db/schema';
import { db, schema } from '$lib/server/db';
import { githubApp } from '$lib/github';

export type ContextGeneratorParams = {
	request: Request;
	locals: {
		user: User | null;
		session: Session | null;
	};
};

export type Context = Awaited<ReturnType<ReturnType<typeof createContextFunc>>>;

export function createContextFunc(skReqEvent: ContextGeneratorParams) {
	return async function ({ req }: FetchCreateContextFnOptions) {
		return {
			req,
			...skReqEvent.locals,
			db,
			dbSchema: schema,
			githubApp
		};
	};
}

export function createCallerContext(ctx: ContextGeneratorParams) {
	return {
		req: ctx.request,
		...ctx.locals,
		db,
		dbSchema: schema,
		githubApp
	} satisfies Context;
}
