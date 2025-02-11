import { adminProcedure, protectedProcedure, t } from '../shared';
import { eq } from 'drizzle-orm';
import { serverEnv } from '$lib/env/server';
import type { Context } from '../context';
import { TRPCError } from '@trpc/server';
import type { db as dbClient, schema as dbSchema } from '$lib/server/db';
import { z } from 'zod';

// #############################################
// #               USER ROUTER                 #
// #############################################

const allUserFilterSchema = z.object({
	filter: z.string().optional()
});

const userRouter = t.router({
	all: adminProcedure.query(async ({ ctx }) => {
		const users = await ctx.db
			.select()
			.from(ctx.dbSchema.user)
			.leftJoin(ctx.dbSchema.person, eq(ctx.dbSchema.user.id, ctx.dbSchema.person.linkedUserId));
		return { users };
	}),
	allAccounts: adminProcedure.query(async ({ ctx }) => {
		const users = await ctx.db.select().from(ctx.dbSchema.user);
		return { users };
	})
});

// #############################################
// #               ADMIN ROUTER                #
// #############################################

export const adminRouter = t.router({
	users: userRouter
});
