import { adminProcedure, t } from '../shared';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { serverEnv } from '$lib/env/server';

/**
 * This file contains most administrative actions. It is broken out into multiple routers depending on what the different actions
 * pertain to. These actions include; whitelisting users, banning users, creating teams, adding/removing users to/from teams, etc.
 */

// #############################################
// #               USER ROUTER                 #
// #############################################

const userRouter = t.router({
	all: adminProcedure.query(async ({ ctx }) => {
		const users = await ctx.db
			.select()
			.from(ctx.dbSchema.user)
			.leftJoin(ctx.dbSchema.profile, eq(ctx.dbSchema.user.id, ctx.dbSchema.profile.linkedUserId));
		return { users };
	}),
	getById: adminProcedure
		.input(z.object({ userId: z.string().nonempty() }))
		.query(async ({ ctx, input }) => {
			const [user] = await ctx.db
				.select()
				.from(ctx.dbSchema.user)
				.where(eq(ctx.dbSchema.user.id, input.userId))
				.leftJoin(
					ctx.dbSchema.profile,
					eq(ctx.dbSchema.user.id, ctx.dbSchema.profile.linkedUserId)
				);
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
				.leftJoin(
					ctx.dbSchema.profile,
					eq(ctx.dbSchema.user.id, ctx.dbSchema.profile.linkedUserId)
				);
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
		const teams = await ctx.db.query.team.findMany({});
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
		}),
	createOne: adminProcedure
		.input(z.object({ name: z.string().nonempty() }))
		.mutation(async ({ ctx, input }) => {
			const ghTeam = await ctx.githubApp.rest.teams.create({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				name: input.name,
				privacy: 'secret'
			});

			const [team] = await ctx.db
				.insert(ctx.dbSchema.team)
				.values({ name: input.name, githubId: ghTeam.data.id, githubSlug: ghTeam.data.slug })
				.returning();
			return { team };
		}),
	addUserToTeam: adminProcedure
		.input(
			z.object({
				teamId: z.string().nonempty(),
				userId: z.string().nonempty(),
				override: z.boolean().default(false)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [user] = await ctx.db
				.select()
				.from(ctx.dbSchema.user)
				.where(eq(ctx.dbSchema.user.id, input.userId));
			if (!user) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
			}

			const [team] = await ctx.db
				.select()
				.from(ctx.dbSchema.team)
				.where(eq(ctx.dbSchema.team.id, input.teamId));
			if (!team) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
			}

			if (user.teamId !== null && !input.override) {
				throw new TRPCError({ code: 'BAD_REQUEST', message: 'User is already on a team' });
			}

			await ctx.db
				.update(ctx.dbSchema.user)
				.set({ teamId: input.teamId })
				.where(eq(ctx.dbSchema.user.id, input.userId));

			return { team };
		})
});

// #############################################
// #              TICKET ROUTER                #
// #############################################

const ticketRouter = t.router({});

// #############################################
// #               ADMIN ROUTER                #
// #############################################

export const adminRouter = t.router({
	users: userRouter,
	teams: teamRouter,
	tickets: ticketRouter
});
