import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { Session, User } from '$lib/server/db/schema';
import { db, schema } from '$lib/server/db';

type ContextGeneratorParams = {
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
			dbSchema: schema
		};
	};
}
