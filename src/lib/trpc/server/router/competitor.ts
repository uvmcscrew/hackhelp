import { protectedProcedure, t } from '../shared';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { serverEnv } from '$lib/env/server';

/**
 * This file contains most actions that a competitor will need. It is broken out into multiple routers depending on what the different actions
 * pertain to. These actions include; creating their team, updating it, creating tickets, updating tickets, handling repositories, etc.
 */

const enforceUserIsInTeam = t.middleware(async ({ ctx, next }) => {
	if (!ctx.user || !ctx.session) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}

	if (!ctx.user.teamId) {
		throw new TRPCError({ code: 'FORBIDDEN' });
	}

	const [team] = await ctx.db
		.select()
		.from(ctx.dbSchema.team)
		.where(eq(ctx.dbSchema.team.id, ctx.user.teamId));

	if (!team) {
		throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
	}

	return next({
		ctx: {
			user: { ...ctx.user, teamId: ctx.user.teamId },
			session: ctx.session,
			team
		}
	});
});

const teamProcedure = protectedProcedure.use(enforceUserIsInTeam);

// #############################################
// #               TEAM ROUTER                 #
// #############################################

const teamRouter = t.router({
	get: teamProcedure.query(async ({ ctx }) => {
		const members = await ctx.db
			.select({
				id: ctx.dbSchema.user.id,
				username: ctx.dbSchema.user.username,
				fullName: ctx.dbSchema.user.fullName
			})
			.from(ctx.dbSchema.user)
			.where(eq(ctx.dbSchema.user.teamId, ctx.team.id))
			.leftJoin(ctx.dbSchema.profile, eq(ctx.dbSchema.user.id, ctx.dbSchema.profile.linkedUserId));
		return { team: ctx.team, members };
	}),
	updateProperties: teamProcedure
		.input(
			z.object({
				name: z.string().nonempty(),
				description: z.string().default('')
			})
		)
		.mutation(async ({ ctx, input }) => {
			const ghUpdate = await ctx.githubApp.rest.teams.updateInOrg({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				team_slug: ctx.team.githubSlug,
				name: input.name,
				description: input.description
			});

			const [team] = await ctx.db
				.update(ctx.dbSchema.team)
				.set({ name: input.name, githubId: ghUpdate.data.id, githubSlug: ghUpdate.data.slug })
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
