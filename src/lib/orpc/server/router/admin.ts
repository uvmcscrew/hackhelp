import { adminProcedure } from '../shared';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { serverEnv } from '$lib/env/server';
import { TICKET_RESOLUTION_STATUS } from '$lib/server/db/schema';
import { ORPCError } from '@orpc/client';

/**
 * This file contains most administrative actions. It is broken out into multiple routers depending on what the different actions
 * pertain to. These actions include; whitelisting users, banning users, creating teams, adding/removing users to/from teams, etc.
 */

// #############################################
// #               USER ROUTER                 #
// #############################################

const userRouter = {
	all: adminProcedure.handler(async ({ context }) => {
		const users = await context.db.client
			.select()
			.from(context.db.schema.user)
			.leftJoin(
				context.dbSchema.profile,
				eq(context.dbSchema.user.id, context.dbSchema.profile.linkedUserId)
			);
		return { users };
	})
	// getById: adminProcedure
	// 	.input(z.object({ userId: z.string().nonempty() }))
	// 	.handler(async ({ context, input }) => {
	// 		const [user] = await context.db
	// 			.select()
	// 			.from(context.dbSchema.user)
	// 			.where(eq(context.dbSchema.user.id, input.userId))
	// 			.leftJoin(
	// 				context.dbSchema.profile,
	// 				eq(context.dbSchema.user.id, context.dbSchema.profile.linkedUserId)
	// 			);
	// 		if (!user) {
	// 			throw new ORPCError('NOT_FOUND', { message: 'User not found' });
	// 		}
	// 		return { user };
	// 	}),
	// getByUsername: adminProcedure
	// 	.input(z.object({ userName: z.string().nonempty() }))
	// 	.handler(async ({ context, input }) => {
	// 		const [user] = await context.db
	// 			.select()
	// 			.from(context.dbSchema.user)
	// 			.where(eq(context.dbSchema.user.username, input.userName))
	// 			.leftJoin(
	// 				context.dbSchema.profile,
	// 				eq(context.dbSchema.user.id, context.dbSchema.profile.linkedUserId)
	// 			);
	// 		if (!user) {
	// 			throw new ORPCError('NOT_FOUND', { message: 'User not found' });
	// 		}
	// 		return { user };
	// 	}),
	// getAllAccounts: adminProcedure.handler(async ({ context }) => {
	// 	const users = await context.db.select().from(context.dbSchema.user);
	// 	return { users };
	// }),
	// getAdmins: adminProcedure.route({ method: 'GET' }).handler(async ({ context }) => {
	// 	const admins = await context.db
	// 		.select()
	// 		.from(context.dbSchema.user)
	// 		.where(eq(context.dbSchema.user.isOrgAdmin, true));
	// 	return { admins };
	// }),
	// whitelistByIdMutation: adminProcedure
	// 	.input(z.object({ userId: z.string().nonempty() }))
	// 	.route({ method: 'POST' })
	// 	.handler(async ({ context, input }) => {
	// 		const [user] = await context.db
	// 			.update(context.dbSchema.profile)
	// 			.set({ isWhitelisted: true })
	// 			.where(eq(context.dbSchema.profile.linkedUserId, input.userId))
	// 			.returning();
	// 		if (!user) {
	// 			throw new ORPCError('NOT_FOUND', { message: 'User not found' });
	// 		}
	// 		return { user };
	// 	})
};

// #############################################
// #               TEAM ROUTER                 #
// #############################################

const teamRouter = {
	// getAll: adminProcedure.handler(async ({ context }) => {
	// 	const teams = await context.db
	// 		.select({
	// 			id: context.dbSchema.team.id,
	// 			name: context.dbSchema.team.name,
	// 			githubId: context.dbSchema.team.githubId,
	// 			githubSlug: context.dbSchema.team.githubSlug,
	// 			memberCount: context.db.$count(
	// 				context.dbSchema.user,
	// 				eq(context.dbSchema.user.teamId, context.dbSchema.team.id)
	// 			),
	// 			joinCode: context.dbSchema.team.joinCode,
	// 			canJoin: context.dbSchema.team.canJoin,
	// 			selectedChallengeId: context.dbSchema.team.selectedChallengeId,
	// 			challengeName: context.dbSchema.challenge.title,
	// 			challengeRepo: context.dbSchema.challenge.linkedRepo
	// 		})
	// 		.from(context.dbSchema.team)
	// 		.leftJoin(
	// 			context.dbSchema.challenge,
	// 			eq(context.dbSchema.team.selectedChallengeId, context.dbSchema.challenge.id)
	// 		);
	// 	return { teams };
	// }),
	// getById: adminProcedure
	// 	.input(z.object({ teamId: z.string().nonempty() }))
	// 	.handler(async ({ context, input }) => {
	// 		const [teamData] = await context.db
	// 			.select()
	// 			.from(context.dbSchema.team)
	// 			.where(eq(context.dbSchema.team.id, input.teamId))
	// 			.leftJoin(
	// 				context.dbSchema.challenge,
	// 				eq(context.dbSchema.team.selectedChallengeId, context.dbSchema.challenge.id)
	// 			);
	// 		if (!teamData) {
	// 			throw new ORPCError('NOT_FOUND', { message: 'User not found' });
	// 		}
	// 		const members = await context.db
	// 			.select()
	// 			.from(context.dbSchema.user)
	// 			.where(eq(context.dbSchema.user.teamId, teamData.team.id));
	// 		return { team: teamData, members };
	// 	}),
	// createOne: adminProcedure
	// 	.input(z.object({ name: z.string().nonempty() }))
	// 	.route({ method: 'POST' })
	// 	.handler(async ({ context, input }) => {
	// 		const ghTeam = await context.githubApp.rest.teams.create({
	// 			org: serverEnv.PUBLIC_GITHUB_ORGNAME,
	// 			name: input.name,
	// 			privacy: 'secret'
	// 		});
	// 		const [team] = await context.db
	// 			.insert(context.dbSchema.team)
	// 			.values({ name: input.name, githubId: ghTeam.data.id, githubSlug: ghTeam.data.slug })
	// 			.returning();
	// 		return { team };
	// 	}),
	// addUserToTeam: adminProcedure
	// 	.input(
	// 		z.object({
	// 			teamId: z.string().nonempty(),
	// 			userId: z.string().nonempty(),
	// 			override: z.boolean().default(false)
	// 		})
	// 	)
	// 	.route({ method: 'POST' })
	// 	.handler(async ({ context, input }) => {
	// 		const [user] = await context.db
	// 			.select()
	// 			.from(context.dbSchema.user)
	// 			.where(eq(context.dbSchema.user.id, input.userId));
	// 		if (!user) {
	// 			throw new ORPCError('NOT_FOUND', { message: 'User not found' });
	// 		}
	// 		const [team] = await context.db
	// 			.select()
	// 			.from(context.dbSchema.team)
	// 			.where(eq(context.dbSchema.team.id, input.teamId));
	// 		if (!team) {
	// 			throw new ORPCError('NOT_FOUND', { message: 'Team not found' });
	// 		}
	// 		if (user.teamId !== null && !input.override) {
	// 			throw new ORPCError('BAD_REQUEST', { message: 'User is already on a team' });
	// 		}
	// 		// Make sure user does not already belong to a team
	// 		// If they do, remove them from that team
	// 		if (user.teamId !== null) {
	// 			const [oldTeam] = await context.db
	// 				.select()
	// 				.from(context.dbSchema.team)
	// 				.where(eq(context.dbSchema.team.id, user.teamId));
	// 			await context.githubApp.rest.teams.removeMembershipForUserInOrg({
	// 				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
	// 				team_slug: oldTeam.githubSlug,
	// 				username: user.username
	// 			});
	// 		}
	// 		// Update DB and github permissions
	// 		await context.db
	// 			.update(context.dbSchema.user)
	// 			.set({ teamId: input.teamId })
	// 			.where(eq(context.dbSchema.user.id, input.userId));
	// 		await context.githubApp.rest.teams.addOrUpdateMembershipForUserInOrg({
	// 			org: serverEnv.PUBLIC_GITHUB_ORGNAME,
	// 			team_slug: team.githubSlug,
	// 			username: user.username
	// 		});
	// 		return { team };
	// 	})
};

// #############################################
// #              TICKET ROUTER                #
// #############################################

const ticketRouter = {
	// getOpenTickets: adminProcedure.handler(async ({ context }) => {
	// 	let tickets = await context.db
	// 		.select({
	// 			id: context.dbSchema.ticket.id,
	// 			title: context.dbSchema.ticket.title,
	// 			assignedMentorName: context.dbSchema.user.fullName,
	// 			assignedMentorId: context.dbSchema.ticket.assignedMentor,
	// 			createdAt: context.dbSchema.ticket.createdAt,
	// 			resolutionStatus: context.dbSchema.ticket.resolutionStatus,
	// 			repository: context.dbSchema.ticket.repository,
	// 			issueNumber: context.dbSchema.ticket.issueNumber,
	// 			challengeRepo: context.dbSchema.challenge.title,
	// 			location: context.dbSchema.ticket.location,
	// 			locationDescription: context.dbSchema.ticket.locationDescription
	// 		})
	// 		.from(context.dbSchema.ticket)
	// 		// .where(ne(context.dbSchema.ticket.resolutionStatus, 'closed'))
	// 		.leftJoin(
	// 			context.dbSchema.user,
	// 			eq(context.dbSchema.ticket.assignedMentor, context.dbSchema.user.id)
	// 		)
	// 		.leftJoin(
	// 			context.dbSchema.challenge,
	// 			eq(context.dbSchema.ticket.challengeId, context.dbSchema.challenge.id)
	// 		)
	// 		.orderBy(desc(context.dbSchema.ticket.createdAt));
	// 	tickets = tickets.sort((a, b) => {
	// 		// if a ticket is closed, sort to the bottom
	// 		if (a.resolutionStatus !== 'closed' && b.resolutionStatus === 'closed') {
	// 			return -1;
	// 		}
	// 		if (a.resolutionStatus === 'closed' && b.resolutionStatus !== 'closed') {
	// 			return 1;
	// 		}
	// 		// next, sort by creation date
	// 		return a.createdAt > b.createdAt ? -1 : 1;
	// 	});
	// 	return { tickets };
	// }),
	// getMyTickets: adminProcedure.handler(async ({ context }) => {
	// 	const tickets = await context.db
	// 		.select({
	// 			id: context.dbSchema.ticket.id,
	// 			title: context.dbSchema.ticket.title,
	// 			assignedMentorName: context.dbSchema.user.fullName,
	// 			createdAt: context.dbSchema.ticket.createdAt,
	// 			resolutionStatus: context.dbSchema.ticket.resolutionStatus,
	// 			repository: context.dbSchema.ticket.repository,
	// 			issueNumber: context.dbSchema.ticket.issueNumber,
	// 			challengeRepo: context.dbSchema.challenge.linkedRepo,
	// 			location: context.dbSchema.ticket.location,
	// 			locationDescription: context.dbSchema.ticket.locationDescription
	// 		})
	// 		.from(context.dbSchema.ticket)
	// 		.where(eq(context.dbSchema.ticket.assignedMentor, context.user.id))
	// 		.leftJoin(
	// 			context.dbSchema.user,
	// 			eq(context.dbSchema.ticket.assignedMentor, context.dbSchema.user.id)
	// 		)
	// 		.leftJoin(
	// 			context.dbSchema.challenge,
	// 			eq(context.dbSchema.ticket.challengeId, context.dbSchema.challenge.id)
	// 		)
	// 		.orderBy(desc(context.dbSchema.ticket.createdAt));
	// 	return { tickets };
	// }),
	// selfAssignMutation: adminProcedure
	// 	.input(z.object({ ticketId: z.string() }))
	// 	.route({ method: 'POST' })
	// 	.handler(async ({ context, input }) => {
	// 		// Check if the ticket exists
	// 		// and is not already assigned to someone else
	// 		const [existingTicket] = await context.db
	// 			.select()
	// 			.from(context.dbSchema.ticket)
	// 			.where(eq(context.dbSchema.ticket.id, input.ticketId));
	// 		if (!existingTicket) {
	// 			throw new ORPCError('NOT_FOUND', { message: 'Ticket not found' });
	// 		}
	// 		if (existingTicket.assignedMentor !== null) {
	// 			throw new ORPCError('BAD_REQUEST', { message: 'Ticket is already assigned' });
	// 		}
	// 		const [ticket] = await context.db
	// 			.update(context.dbSchema.ticket)
	// 			.set({
	// 				assignedMentor: context.user.id,
	// 				resolutionStatus:
	// 					existingTicket.resolutionStatus === 'open'
	// 						? 'assigned'
	// 						: existingTicket.resolutionStatus
	// 			})
	// 			.where(eq(context.dbSchema.ticket.id, input.ticketId))
	// 			.returning();
	// 		await context.githubApp.rest.issues.createComment({
	// 			owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
	// 			repo: ticket.repository,
	// 			issue_number: ticket.issueNumber,
	// 			body: `This issue has been assigned to @${context.user.username} (${context.user.fullName}).`
	// 		});
	// 		return { ticket };
	// 	}),
	// assignToMutation: adminProcedure
	// 	.input(z.object({ ticketId: z.string(), userId: z.string() }))
	// 	.route({ method: 'POST' })
	// 	.handler(async ({ context, input }) => {
	// 		const [existingTicket] = await context.db
	// 			.select()
	// 			.from(context.dbSchema.ticket)
	// 			.where(eq(context.dbSchema.ticket.id, input.ticketId));
	// 		if (!existingTicket) {
	// 			throw new ORPCError('NOT_FOUND', { message: 'Ticket not found' });
	// 		}
	// 		// Check if the user exists and is an admin (qualifier for being a mentor)
	// 		const [user] = await context.db
	// 			.select()
	// 			.from(context.dbSchema.user)
	// 			.where(
	// 				and(
	// 					eq(context.dbSchema.user.id, input.userId),
	// 					eq(context.dbSchema.user.isOrgAdmin, true)
	// 				)
	// 			);
	// 		if (!user) {
	// 			throw new ORPCError('NOT_FOUND', { message: 'Admin not found' });
	// 		}
	// 		// Check if the ticket is already assigned to someone else
	// 		const [ticket] = await context.db
	// 			.update(context.dbSchema.ticket)
	// 			.set({
	// 				assignedMentor: user.id,
	// 				resolutionStatus:
	// 					existingTicket.resolutionStatus === 'open'
	// 						? 'assigned'
	// 						: existingTicket.resolutionStatus
	// 			})
	// 			.where(eq(context.dbSchema.ticket.id, input.ticketId))
	// 			.returning();
	// 		await context.githubApp.rest.issues.createComment({
	// 			owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
	// 			repo: ticket.repository,
	// 			issue_number: ticket.issueNumber,
	// 			body: `This issue has been assigned to @${user.username}.`
	// 		});
	// 		return { ticket };
	// 	}),
	// unassignMutation: adminProcedure
	// 	.input(z.object({ ticketId: z.string() }))
	// 	.route({ method: 'POST' })
	// 	.handler(async ({ context, input }) => {
	// 		const [existingTicket] = await context.db
	// 			.select()
	// 			.from(context.dbSchema.ticket)
	// 			.where(eq(context.dbSchema.ticket.id, input.ticketId));
	// 		if (!existingTicket) {
	// 			throw new ORPCError('NOT_FOUND', { message: 'Ticket not found' });
	// 		}
	// 		const [ticket] = await context.db
	// 			.update(context.dbSchema.ticket)
	// 			.set({
	// 				assignedMentor: null,
	// 				resolutionStatus:
	// 					existingTicket.resolutionStatus === 'assigned'
	// 						? 'open'
	// 						: existingTicket.resolutionStatus
	// 			})
	// 			.where(eq(context.dbSchema.ticket.id, input.ticketId))
	// 			.returning();
	// 		await context.githubApp.rest.issues.createComment({
	// 			owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
	// 			repo: ticket.repository,
	// 			issue_number: ticket.issueNumber,
	// 			body: `This issue has been unassigned.`
	// 		});
	// 		return { ticket };
	// 	}),
	// getTicketById: adminProcedure
	// 	.input(z.object({ ticketId: z.string() }))
	// 	.handler(async ({ context, input }) => {
	// 		const [ticket] = await context.db
	// 			.select()
	// 			.from(context.dbSchema.ticket)
	// 			.where(eq(context.dbSchema.ticket.id, input.ticketId))
	// 			.leftJoin(
	// 				context.dbSchema.user,
	// 				eq(context.dbSchema.ticket.assignedMentor, context.dbSchema.user.id)
	// 			)
	// 			.leftJoin(
	// 				context.dbSchema.challenge,
	// 				eq(context.dbSchema.ticket.challengeId, context.dbSchema.challenge.id)
	// 			);
	// 		if (!ticket) {
	// 			throw new ORPCError('NOT_FOUND', { message: 'Ticket not found' });
	// 		}
	// 		const repoLanguages = await context.githubApp.rest.repos.listLanguages({
	// 			owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
	// 			repo: ticket.ticket.repository
	// 		});
	// 		return { ticket, langs: repoLanguages.data };
	// 	}),
	// deleteTicket: adminProcedure
	// 	.input(z.object({ ticketId: z.string() }))
	// 	.route({ method: 'DELETE' })
	// 	.handler(async ({ context, input }) => {
	// 		const [ticket] = await context.db
	// 			.delete(context.dbSchema.ticket)
	// 			.where(eq(context.dbSchema.ticket.id, input.ticketId))
	// 			.returning();
	// 		if (!ticket) {
	// 			throw new ORPCError('NOT_FOUND', { message: 'Ticket not found' });
	// 		}
	// 		await context.githubApp.rest.issues.createComment({
	// 			owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
	// 			repo: ticket.repository,
	// 			issue_number: ticket.issueNumber,
	// 			body: `The ticket has been deleted by an admin.`
	// 		});
	// 		return { ticket };
	// 	}),
	// updateTicketStatusMutation: adminProcedure
	// 	.input(
	// 		z.object({
	// 			ticketId: z.string(),
	// 			status: z.enum(TICKET_RESOLUTION_STATUS)
	// 		})
	// 	)
	// 	.route({ method: 'POST' })
	// 	.handler(async ({ context, input }) => {
	// 		const [ticket] = await context.db
	// 			.update(context.dbSchema.ticket)
	// 			.set({ resolutionStatus: input.status })
	// 			.where(eq(context.dbSchema.ticket.id, input.ticketId))
	// 			.returning();
	// 		if (!ticket) {
	// 			throw new ORPCError('NOT_FOUND', { message: 'Ticket not found' });
	// 		}
	// 		await context.githubApp.rest.issues.createComment({
	// 			owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
	// 			repo: ticket.repository,
	// 			issue_number: ticket.issueNumber,
	// 			body: `The ticket status has been updated to ${input.status}.`
	// 		});
	// 		return { ticket };
	// 	})
};

// #############################################
// #               ADMIN ROUTER                #
// #############################################

export const adminRouter = {
	users: userRouter,
	teams: teamRouter,
	tickets: ticketRouter
};
