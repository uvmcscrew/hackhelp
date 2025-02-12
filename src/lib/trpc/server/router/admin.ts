import { adminProcedure, t } from '../shared';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

// #############################################
// #               USER ROUTER                 #
// #############################################

const userRouter = t.router({
	all: adminProcedure.query(async ({ ctx }) => {
		const users = await ctx.db
			.select()
			.from(ctx.dbSchema.user)
			.leftJoin(ctx.dbSchema.person, eq(ctx.dbSchema.user.id, ctx.dbSchema.person.linkedUserId));
		return { users };
	}),
	getById: adminProcedure
		.input(z.object({ userId: z.string().nonempty() }))
		.query(async ({ ctx, input }) => {
			const [user] = await ctx.db
				.select()
				.from(ctx.dbSchema.user)
				.where(eq(ctx.dbSchema.user.id, input.userId))
				.leftJoin(ctx.dbSchema.person, eq(ctx.dbSchema.user.id, ctx.dbSchema.person.linkedUserId));
			if (!user) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
			}
			return { user };
		}),
	getByUsername: adminProcedure
		.input(z.object({ userName: z.string().nonempty() }))
		.query(async ({ ctx, input }) => {
			const [user] = await ctx.db
				.select()
				.from(ctx.dbSchema.user)
				.where(eq(ctx.dbSchema.user.username, input.userName))
				.leftJoin(ctx.dbSchema.person, eq(ctx.dbSchema.user.id, ctx.dbSchema.person.linkedUserId));
			if (!user) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
			}
			return { user };
		}),
	allAccounts: adminProcedure.query(async ({ ctx }) => {
		const users = await ctx.db.select().from(ctx.dbSchema.user);
		return { users };
	})
});

// #############################################
// #               TEAM ROUTER                 #
// #############################################

const teamRouter = t.router({
	all: adminProcedure.query(async ({ ctx }) => {
		const teams = await ctx.db.select().from(ctx.dbSchema.team);
		return { teams };
	}),
	getById: adminProcedure
		.input(z.object({ teamId: z.string().nonempty() }))
		.query(async ({ ctx, input }) => {
			const [team] = await ctx.db
				.select()
				.from(ctx.dbSchema.team)
				.where(eq(ctx.dbSchema.team.id, input.teamId));
			if (!team) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
			}
			return { team };
		})
});

// #############################################
// #               ADMIN ROUTER                #
// #############################################

export const adminRouter = t.router({
	users: userRouter,
	teams: teamRouter
});
