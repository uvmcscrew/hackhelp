import { adminProcedure, t } from '../shared';
import { eq, ne, desc } from 'drizzle-orm';
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

const ticketRouter = t.router({
	openTickets: adminProcedure.query(async ({ ctx }) => {
		const tickets = await ctx.db
			.select({
				id: ctx.dbSchema.ticket.id,
				title: ctx.dbSchema.ticket.title,
				assignedMentorName: ctx.dbSchema.user.fullName,
				assignedMentorId: ctx.dbSchema.ticket.assignedMentor,
				createdAt: ctx.dbSchema.ticket.createdAt,
				resolutionStatus: ctx.dbSchema.ticket.resolutionStatus,
				repository: ctx.dbSchema.ticket.repository,
				issueNumber: ctx.dbSchema.ticket.issueNumber,
				challengeRepo: ctx.dbSchema.challenge.title
			})
			.from(ctx.dbSchema.ticket)
			.where(ne(ctx.dbSchema.ticket.resolutionStatus, 'closed'))
			.leftJoin(ctx.dbSchema.user, eq(ctx.dbSchema.ticket.assignedMentor, ctx.dbSchema.user.id))
			.leftJoin(
				ctx.dbSchema.challenge,
				eq(ctx.dbSchema.ticket.challengeId, ctx.dbSchema.challenge.id)
			)
			.orderBy(desc(ctx.dbSchema.ticket.createdAt));
		return { tickets };
	}),
	myTickets: adminProcedure.query(async ({ ctx }) => {
		const tickets = await ctx.db
			.select({
				id: ctx.dbSchema.ticket.id,
				title: ctx.dbSchema.ticket.title,
				assignedMentorName: ctx.dbSchema.user.fullName,
				createdAt: ctx.dbSchema.ticket.createdAt,
				resolutionStatus: ctx.dbSchema.ticket.resolutionStatus,
				repository: ctx.dbSchema.ticket.repository,
				issueNumber: ctx.dbSchema.ticket.issueNumber,
				challengeRepo: ctx.dbSchema.challenge.linkedRepo
			})
			.from(ctx.dbSchema.ticket)
			.where(eq(ctx.dbSchema.ticket.assignedMentor, ctx.user.id))
			.leftJoin(ctx.dbSchema.user, eq(ctx.dbSchema.ticket.assignedMentor, ctx.dbSchema.user.id))
			.leftJoin(
				ctx.dbSchema.challenge,
				eq(ctx.dbSchema.ticket.challengeId, ctx.dbSchema.challenge.id)
			)
			.orderBy(desc(ctx.dbSchema.ticket.createdAt));
		return { tickets };
	}),
	selfAssign: adminProcedure
		.input(z.object({ ticketId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			// Check if the ticket exists
			// and is not already assigned to someone else
			const [existingTicket] = await ctx.db
				.select()
				.from(ctx.dbSchema.ticket)
				.where(eq(ctx.dbSchema.ticket.id, input.ticketId));
			if (!existingTicket) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });
			}
			if (existingTicket.assignedMentor !== null) {
				throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ticket is already assigned' });
			}

			const [ticket] = await ctx.db
				.update(ctx.dbSchema.ticket)
				.set({ assignedMentor: ctx.user.id })
				.where(eq(ctx.dbSchema.ticket.id, input.ticketId))
				.returning();

			await ctx.githubApp.rest.issues.createComment({
				owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
				repo: ticket.repository,
				issue_number: ticket.issueNumber,
				body: `This issue has been assigned to @${ctx.user.username} (${ctx.user.fullName}).`
			});

			return { ticket };
		})
});

// #############################################
// #               ADMIN ROUTER                #
// #############################################

export const adminRouter = t.router({
	users: userRouter,
	teams: teamRouter,
	tickets: ticketRouter
});
