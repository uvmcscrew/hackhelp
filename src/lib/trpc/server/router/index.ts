import { z } from 'zod';
import { protectedProcedure, t } from '../shared';
import { eq } from 'drizzle-orm';

const accountRouter = t.router({
	get: protectedProcedure.query(({ ctx }) => {
		return { user: ctx.user };
	}),
	getWithStatus: protectedProcedure.query(async ({ ctx }) => {
		const [userStatus] = await ctx.db
			.select()
			.from(ctx.dbSchema.userStatus)
			.where(eq(ctx.dbSchema.userStatus.linkedUserId, ctx.user.id));
		return { user: ctx.user, session: ctx.session, userStatus };
	})
});

export const appRouter = t.router({
	hello: t.procedure.input(z.string()).query((opts) => {
		return { greeting: `Hello, ${opts.input}!` };
	}),
	account: accountRouter
});
