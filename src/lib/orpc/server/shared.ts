import { ORPCError, os } from '@orpc/server';
import type { Context } from './context';

export const o = os.$context<Context>();

const enforceUserIsAuthed = o.middleware(({ context, next }) => {
	if (!context.user) {
		throw new ORPCError('UNAUTHORIZED', { cause: 'You are not logged in' });
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
	if (!context.user) {
		throw new ORPCError('UNAUTHORIZED', { cause: 'You are not logged in' });
	}

	if (!context.user.role?.split(',').includes('admin')) {
		throw new ORPCError('FORBIDDEN', { cause: 'You are not an administrator' });
	}

	return next({
		context: {
			user: context.user,
			session: context.session
		}
	});
});

export const adminProcedure = protectedProcedure.use(enforceUserIsAdmin);
