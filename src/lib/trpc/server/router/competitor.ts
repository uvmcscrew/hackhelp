import { adminProcedure, protectedProcedure, t } from '../shared';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { serverEnv } from '$lib/env/server';
import { team } from '$lib/server/db/schema';

/**
 * This file contains most actions that a competitor will need. It is broken out into multiple routers depending on what the different actions
 * pertain to. These actions include; creating their team, updating it, creating tickets, updating tickets, handling repositories, etc.
 */

const enforceUserIsInTeam = t.middleware(({ ctx, next }) => {
	if (!ctx.user || !ctx.session) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}

	if (!ctx.user.teamId) {
		throw new TRPCError({ code: 'FORBIDDEN' });
	}

	return next({
		ctx: {
			user: ctx.user,
			session: ctx.session
		}
	});
});

const teamProcedure = protectedProcedure.use(enforceUserIsInTeam);

// #############################################
// #               TEAM ROUTER                 #
// #############################################

const teamRouter = t.router({
	get: protectedProcedure.query(async ({ ctx }) => {
		const [team] = await ctx.db
			.select()
			.from(ctx.dbSchema.team)
			.where(eq(ctx.dbSchema.team.id, ctx.user.teamId));
		if (!team) {
			throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
		}
		return { team };
	}),
	update: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				canJoin: z.boolean()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [team] = await ctx.db
				.update(ctx.dbSchema.team)
				.set({ name: input.name, canJoin: input.canJoin })
				.where(eq(ctx.dbSchema.team.id, ctx.user.teamId))
				.returning();
			if (!team) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
			}
			return { team };
		})
});

// #############################################
// #              TICKET ROUTER                #
// #############################################

const ticketRouter = t.router({});

// #############################################
// #            COMPETITOR ROUTER              #
// #############################################

export const adminRouter = t.router({
	tickets: ticketRouter,
	team: teamRouter
});
