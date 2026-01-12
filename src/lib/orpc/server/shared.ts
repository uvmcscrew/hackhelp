import { ORPCError, os } from '@orpc/server';
import type { Context } from './context';

export const o = os.$context<Context>();

const enforceUserIsAuthed = o.middleware(({ context, next }) => {
	if (!context.user || !context.session) {
		throw new ORPCError('UNAUTHORIZED');
	}
	return next({
		context: {
			// infers the `user` and `session` as non-nullable
			user: context.user,
			session: context.session
		}
	});
});

export const protectedProcedure = o.use(enforceUserIsAuthed);

const enforceUserIsAdmin = o.middleware(({ context, next }) => {
	if (!context.user || !context.session) {
		throw new ORPCError('UNAUTHORIZED');
	}

	if (!context.user.isOrgAdmin) {
		throw new ORPCError('FORBIDDEN');
	}

	return next({
		context: {
			user: context.user,
			session: context.session
		}
	});
});

export const adminProcedure = protectedProcedure.use(enforceUserIsAdmin);
