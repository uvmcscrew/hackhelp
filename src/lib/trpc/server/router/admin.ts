import { adminProcedure, t } from '../shared';
import { eq, ne, desc, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { serverEnv } from '$lib/env/server';
import { TICKET_RESOLUTION_STATUS } from '$lib/server/db/schema';

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
	}),
	getAdmins: adminProcedure.query(async ({ ctx }) => {
		const admins = await ctx.db
			.select()
			.from(ctx.dbSchema.user)
			.where(eq(ctx.dbSchema.user.isOrgAdmin, true));
		return { admins };
	}),
	whitelistById: adminProcedure
		.input(z.object({ userId: z.string().nonempty() }))
		.mutation(async ({ ctx, input }) => {
			const [user] = await ctx.db
				.update(ctx.dbSchema.profile)
				.set({ isWhitelisted: true })
				.where(eq(ctx.dbSchema.profile.linkedUserId, input.userId))
				.returning();
			if (!user) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
			}
			return { user };
		})
});

// #############################################
// #               TEAM ROUTER                 #
// #############################################

const teamRouter = t.router({
	all: adminProcedure.query(async ({ ctx }) => {
		const teams = await ctx.db
			.select({
				id: ctx.dbSchema.team.id,
				name: ctx.dbSchema.team.name,
				githubId: ctx.dbSchema.team.githubId,
				githubSlug: ctx.dbSchema.team.githubSlug,
				memberCount: ctx.db.$count(
					ctx.dbSchema.user,
					eq(ctx.dbSchema.user.teamId, ctx.dbSchema.team.id)
				),
				joinCode: ctx.dbSchema.team.joinCode,
				canJoin: ctx.dbSchema.team.canJoin,
				selectedChallengeId: ctx.dbSchema.team.selectedChallengeId,
				challengeName: ctx.dbSchema.challenge.title,
				challengeRepo: ctx.dbSchema.challenge.linkedRepo
			})
			.from(ctx.dbSchema.team)
			.leftJoin(
				ctx.dbSchema.challenge,
				eq(ctx.dbSchema.team.selectedChallengeId, ctx.dbSchema.challenge.id)
			);
		return { teams };
	}),
	getById: adminProcedure
		.input(z.object({ teamId: z.string().nonempty() }))
		.query(async ({ ctx, input }) => {
			const [teamData] = await ctx.db
				.select()
				.from(ctx.dbSchema.team)
				.where(eq(ctx.dbSchema.team.id, input.teamId))
				.leftJoin(
					ctx.dbSchema.challenge,
					eq(ctx.dbSchema.team.selectedChallengeId, ctx.dbSchema.challenge.id)
				);
			if (!teamData) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
			}
			const members = await ctx.db
				.select()
				.from(ctx.dbSchema.user)
				.where(eq(ctx.dbSchema.user.teamId, teamData.team.id));
			return { team: teamData, members };
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

			// Make sure user does not already belong to a team
			// If they do, remove them from that team
			if (user.teamId !== null) {
				const [oldTeam] = await ctx.db
					.select()
					.from(ctx.dbSchema.team)
					.where(eq(ctx.dbSchema.team.id, user.teamId));

				await ctx.githubApp.rest.teams.removeMembershipForUserInOrg({
					org: serverEnv.PUBLIC_GITHUB_ORGNAME,
					team_slug: oldTeam.githubSlug,
					username: user.username
				});
			}

			// Update DB and github permissions
			await ctx.db
				.update(ctx.dbSchema.user)
				.set({ teamId: input.teamId })
				.where(eq(ctx.dbSchema.user.id, input.userId));

			await ctx.githubApp.rest.teams.addOrUpdateMembershipForUserInOrg({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				team_slug: team.githubSlug,
				username: user.username
			});

			return { team };
		})
});

// #############################################
// #              TICKET ROUTER                #
// #############################################

const ticketRouter = t.router({
	openTickets: adminProcedure.query(async ({ ctx }) => {
		let tickets = await ctx.db
			.select({
				id: ctx.dbSchema.ticket.id,
				title: ctx.dbSchema.ticket.title,
				assignedMentorName: ctx.dbSchema.user.fullName,
				assignedMentorId: ctx.dbSchema.ticket.assignedMentor,
				createdAt: ctx.dbSchema.ticket.createdAt,
				resolutionStatus: ctx.dbSchema.ticket.resolutionStatus,
				repository: ctx.dbSchema.ticket.repository,
				issueNumber: ctx.dbSchema.ticket.issueNumber,
				challengeRepo: ctx.dbSchema.challenge.title,
				location: ctx.dbSchema.ticket.location,
				locationDescription: ctx.dbSchema.ticket.locationDescription
			})
			.from(ctx.dbSchema.ticket)
			// .where(ne(ctx.dbSchema.ticket.resolutionStatus, 'closed'))
			.leftJoin(ctx.dbSchema.user, eq(ctx.dbSchema.ticket.assignedMentor, ctx.dbSchema.user.id))
			.leftJoin(
				ctx.dbSchema.challenge,
				eq(ctx.dbSchema.ticket.challengeId, ctx.dbSchema.challenge.id)
			)
			.orderBy(desc(ctx.dbSchema.ticket.createdAt));

		tickets = tickets.sort((a, b) => {
			// if a ticket is closed, sort to the bottom
			if (a.resolutionStatus !== 'closed' && b.resolutionStatus === 'closed') {
				return -1;
			}
			if (a.resolutionStatus === 'closed' && b.resolutionStatus !== 'closed') {
				return 1;
			}
			// next, sort by creation date
			return a.createdAt > b.createdAt ? -1 : 1;
		});
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
				challengeRepo: ctx.dbSchema.challenge.linkedRepo,
				location: ctx.dbSchema.ticket.location,
				locationDescription: ctx.dbSchema.ticket.locationDescription
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
				.set({
					assignedMentor: ctx.user.id,
					resolutionStatus:
						existingTicket.resolutionStatus === 'open'
							? 'assigned'
							: existingTicket.resolutionStatus
				})
				.where(eq(ctx.dbSchema.ticket.id, input.ticketId))
				.returning();

			await ctx.githubApp.rest.issues.createComment({
				owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
				repo: ticket.repository,
				issue_number: ticket.issueNumber,
				body: `This issue has been assigned to @${ctx.user.username} (${ctx.user.fullName}).`
			});

			return { ticket };
		}),
	assignTo: adminProcedure
		.input(z.object({ ticketId: z.string(), userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const [existingTicket] = await ctx.db
				.select()
				.from(ctx.dbSchema.ticket)
				.where(eq(ctx.dbSchema.ticket.id, input.ticketId));
			if (!existingTicket) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });
			}

			// Check if the user exists and is an admin (qualifier for being a mentor)
			const [user] = await ctx.db
				.select()
				.from(ctx.dbSchema.user)
				.where(and(eq(ctx.dbSchema.user.id, input.userId), eq(ctx.dbSchema.user.isOrgAdmin, true)));
			if (!user) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Admin not found' });
			}

			// Check if the ticket is already assigned to someone else
			const [ticket] = await ctx.db
				.update(ctx.dbSchema.ticket)
				.set({
					assignedMentor: user.id,
					resolutionStatus:
						existingTicket.resolutionStatus === 'open'
							? 'assigned'
							: existingTicket.resolutionStatus
				})
				.where(eq(ctx.dbSchema.ticket.id, input.ticketId))

				.returning();

			await ctx.githubApp.rest.issues.createComment({
				owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
				repo: ticket.repository,
				issue_number: ticket.issueNumber,
				body: `This issue has been assigned to @${user.username}.`
			});
			return { ticket };
		}),

	unassign: adminProcedure
		.input(z.object({ ticketId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const [existingTicket] = await ctx.db
				.select()
				.from(ctx.dbSchema.ticket)
				.where(eq(ctx.dbSchema.ticket.id, input.ticketId));
			if (!existingTicket) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });
			}

			const [ticket] = await ctx.db
				.update(ctx.dbSchema.ticket)
				.set({
					assignedMentor: null,
					resolutionStatus:
						existingTicket.resolutionStatus === 'assigned'
							? 'open'
							: existingTicket.resolutionStatus
				})
				.where(eq(ctx.dbSchema.ticket.id, input.ticketId))
				.returning();

			await ctx.githubApp.rest.issues.createComment({
				owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
				repo: ticket.repository,
				issue_number: ticket.issueNumber,
				body: `This issue has been unassigned.`
			});

			return { ticket };
		}),
	getTicketById: adminProcedure
		.input(z.object({ ticketId: z.string() }))
		.query(async ({ ctx, input }) => {
			const [ticket] = await ctx.db
				.select()
				.from(ctx.dbSchema.ticket)
				.where(eq(ctx.dbSchema.ticket.id, input.ticketId))
				.leftJoin(ctx.dbSchema.user, eq(ctx.dbSchema.ticket.assignedMentor, ctx.dbSchema.user.id))
				.leftJoin(
					ctx.dbSchema.challenge,
					eq(ctx.dbSchema.ticket.challengeId, ctx.dbSchema.challenge.id)
				);
			if (!ticket) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });
			}
			const repoLanguages = await ctx.githubApp.rest.repos.listLanguages({
				owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
				repo: ticket.ticket.repository
			});
			return { ticket, langs: repoLanguages.data };
		}),
	deleteTicket: adminProcedure
		.input(z.object({ ticketId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const [ticket] = await ctx.db
				.delete(ctx.dbSchema.ticket)
				.where(eq(ctx.dbSchema.ticket.id, input.ticketId))
				.returning();
			if (!ticket) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });
			}

			await ctx.githubApp.rest.issues.createComment({
				owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
				repo: ticket.repository,
				issue_number: ticket.issueNumber,
				body: `The ticket has been deleted by an admin.`
			});

			return { ticket };
		}),

	updateTicketStatus: adminProcedure
		.input(
			z.object({
				ticketId: z.string(),
				status: z.enum(TICKET_RESOLUTION_STATUS)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [ticket] = await ctx.db
				.update(ctx.dbSchema.ticket)
				.set({ resolutionStatus: input.status })
				.where(eq(ctx.dbSchema.ticket.id, input.ticketId))
				.returning();
			if (!ticket) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });
			}

			await ctx.githubApp.rest.issues.createComment({
				owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
				repo: ticket.repository,
				issue_number: ticket.issueNumber,
				body: `The ticket status has been updated to ${input.status}.`
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
