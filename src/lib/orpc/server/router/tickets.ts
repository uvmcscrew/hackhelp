import { protectedProcedure, adminProcedure } from '../shared';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { ORPCError } from '@orpc/client';
import { createTicketSchema } from '$lib/schemas';
import { checkRolePermission } from '$lib/auth/permissions';
import { serverEnv } from '$lib/env/server';
import { TICKET_RESOLUTION_STATUS } from '$lib/server/db/schema';

// ─── Competitor Endpoints ──────────────────────────────────────────────

const competitorTickets = {
	/**
	 * List open GitHub issues across all team repos that don't already have tickets.
	 * Requires the caller to be on a team with a GitHub slug.
	 */
	teamIssues: protectedProcedure.handler(async ({ context }) => {
		const { teamMembers, team, ticket } = context.db.schema;

		// Find caller's team
		const [membership] = await context.db.client
			.select()
			.from(teamMembers)
			.where(eq(teamMembers.userId, context.user.id));

		if (!membership) throw new ORPCError('BAD_REQUEST', { message: 'You are not on a team' });

		const [myTeam] = await context.db.client
			.select()
			.from(team)
			.where(eq(team.id, membership.teamId));

		if (!myTeam?.githubSlug) {
			return { issues: [] };
		}

		// Get team repos (filter out prompt* repos)
		const { data: repos } = await context.githubApp.rest.teams.listReposInOrg({
			org: serverEnv.PUBLIC_GITHUB_ORGNAME,
			team_slug: myTeam.githubSlug
		});

		const filteredRepos = repos.filter((r) => !r.name.startsWith('prompt'));

		// Get open issues from all repos
		const issuesRaw = await Promise.all(
			filteredRepos.map(async (repo) => {
				const { data } = await context.githubApp.rest.issues.listForRepo({
					owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
					repo: repo.name,
					state: 'open'
				});
				return data;
			})
		);

		// Get existing tickets for this team to filter them out
		const existingTickets = await context.db.client
			.select({
				issueNumber: ticket.issueNumber,
				repository: ticket.repository
			})
			.from(ticket)
			.where(eq(ticket.teamId, myTeam.id));

		const issues = issuesRaw
			.flatMap((d) => d)
			.filter((issue) => {
				const repoName = issue.repository_url.split('/').pop() ?? '';
				return !existingTickets.some(
					(t) => t.issueNumber === issue.number && t.repository === repoName
				);
			});

		return {
			issues: issues.map((issue) => ({
				id: issue.id,
				title: issue.title,
				repoName: issue.repository_url.split('/').pop() ?? '',
				issueNumber: issue.number
			}))
		};
	}),

	/**
	 * All tickets for the caller's team, joined with assigned mentor name.
	 */
	myTeamTickets: protectedProcedure.handler(async ({ context }) => {
		const { teamMembers, ticket, user } = context.db.schema;

		const [membership] = await context.db.client
			.select()
			.from(teamMembers)
			.where(eq(teamMembers.userId, context.user.id));

		if (!membership) throw new ORPCError('BAD_REQUEST', { message: 'You are not on a team' });

		const tickets = await context.db.client
			.select({
				id: ticket.id,
				title: ticket.title,
				createdAt: ticket.createdAt,
				resolutionStatus: ticket.resolutionStatus,
				repository: ticket.repository,
				issueNumber: ticket.issueNumber,
				assignedMentorName: user.name
			})
			.from(ticket)
			.where(eq(ticket.teamId, membership.teamId))
			.leftJoin(user, eq(ticket.assignedMentorId, user.id))
			.orderBy(desc(ticket.createdAt));

		return { tickets };
	}),

	/**
	 * Create a new ticket from a GitHub issue.
	 */
	create: protectedProcedure.input(createTicketSchema).handler(async ({ context, input }) => {
		const { teamMembers, team, ticket } = context.db.schema;

		const [membership] = await context.db.client
			.select()
			.from(teamMembers)
			.where(eq(teamMembers.userId, context.user.id));

		if (!membership) throw new ORPCError('BAD_REQUEST', { message: 'You are not on a team' });

		const [myTeam] = await context.db.client
			.select()
			.from(team)
			.where(eq(team.id, membership.teamId));

		if (!myTeam) throw new ORPCError('NOT_FOUND', { message: 'Team not found' });

		// Insert ticket
		const [created] = await context.db.client
			.insert(ticket)
			.values({
				teamId: myTeam.id,
				createdById: context.user.id,
				issueNumber: input.issueNumber,
				repository: input.repository,
				title: input.title
			})
			.returning();

		// Fire-and-forget: post a comment on the GitHub issue
		context.githubApp.rest.issues
			.createComment({
				owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
				repo: input.repository,
				issue_number: input.issueNumber,
				body: `This issue has been linked to a help ticket.`
			})
			.catch(() => {});

		return { ticket: created };
	})
};

// ─── Mentor Endpoints ──────────────────────────────────────────────────

const mentorTickets = {
	/**
	 * All tickets, joined with team name, mentor name, team location.
	 * Optional status filter.
	 */
	allTickets: protectedProcedure
		.input(
			z
				.object({
					status: z.enum(TICKET_RESOLUTION_STATUS).optional()
				})
				.optional()
		)
		.handler(async ({ context, input }) => {
			if (
				!context.user.role ||
				!checkRolePermission({ roles: context.user.role, permissions: { anyTicket: ['list'] } })
			) {
				throw new ORPCError('FORBIDDEN', { message: 'You do not have permission to view tickets' });
			}

			const { ticket, team, user } = context.db.schema;

			const baseConditions = input?.status ? eq(ticket.resolutionStatus, input.status) : undefined;

			const tickets = await context.db.client
				.select({
					id: ticket.id,
					title: ticket.title,
					createdAt: ticket.createdAt,
					resolutionStatus: ticket.resolutionStatus,
					repository: ticket.repository,
					issueNumber: ticket.issueNumber,
					assignedMentorId: ticket.assignedMentorId,
					assignedMentorName: user.name,
					teamId: ticket.teamId,
					teamName: team.name,
					teamRoom: team.room,
					teamLocationDescription: team.locationDescription
				})
				.from(ticket)
				.leftJoin(team, eq(ticket.teamId, team.id))
				.leftJoin(user, eq(ticket.assignedMentorId, user.id))
				.where(baseConditions)
				.orderBy(desc(ticket.createdAt));

			return { tickets };
		}),

	/**
	 * Tickets assigned to the current mentor.
	 */
	myAssignedTickets: protectedProcedure.handler(async ({ context }) => {
		if (
			!context.user.role ||
			!checkRolePermission({ roles: context.user.role, permissions: { anyTicket: ['list'] } })
		) {
			throw new ORPCError('FORBIDDEN', { message: 'You do not have permission to view tickets' });
		}

		const { ticket, team, user } = context.db.schema;

		const tickets = await context.db.client
			.select({
				id: ticket.id,
				title: ticket.title,
				createdAt: ticket.createdAt,
				resolutionStatus: ticket.resolutionStatus,
				repository: ticket.repository,
				issueNumber: ticket.issueNumber,
				assignedMentorId: ticket.assignedMentorId,
				assignedMentorName: user.name,
				teamId: ticket.teamId,
				teamName: team.name,
				teamRoom: team.room,
				teamLocationDescription: team.locationDescription
			})
			.from(ticket)
			.leftJoin(team, eq(ticket.teamId, team.id))
			.leftJoin(user, eq(ticket.assignedMentorId, user.id))
			.where(eq(ticket.assignedMentorId, context.user.id))
			.orderBy(desc(ticket.createdAt));

		return { tickets };
	}),

	/**
	 * Claim an open ticket (sets mentor and status to 'claimed').
	 */
	claimTicket: protectedProcedure
		.input(z.object({ ticketId: z.string() }))
		.handler(async ({ context, input }) => {
			if (
				!context.user.role ||
				!checkRolePermission({
					roles: context.user.role,
					permissions: { anyTicket: ['update'] }
				})
			) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to claim tickets'
				});
			}

			const { ticket } = context.db.schema;

			const [existing] = await context.db.client
				.select()
				.from(ticket)
				.where(eq(ticket.id, input.ticketId));

			if (!existing) throw new ORPCError('NOT_FOUND', { message: 'Ticket not found' });

			if (existing.resolutionStatus !== 'open') {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Only open tickets can be claimed'
				});
			}

			const [updated] = await context.db.client
				.update(ticket)
				.set({
					assignedMentorId: context.user.id,
					resolutionStatus: 'claimed'
				})
				.where(eq(ticket.id, input.ticketId))
				.returning();

			return { ticket: updated };
		}),

	/**
	 * Update ticket status. Validates transitions.
	 * Setting to 'open' unassigns the mentor.
	 */
	updateStatus: protectedProcedure
		.input(
			z.object({
				ticketId: z.string(),
				status: z.enum(TICKET_RESOLUTION_STATUS)
			})
		)
		.handler(async ({ context, input }) => {
			if (
				!context.user.role ||
				!checkRolePermission({
					roles: context.user.role,
					permissions: { anyTicket: ['update'] }
				})
			) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to update tickets'
				});
			}

			const { ticket } = context.db.schema;

			const [existing] = await context.db.client
				.select()
				.from(ticket)
				.where(eq(ticket.id, input.ticketId));

			if (!existing) throw new ORPCError('NOT_FOUND', { message: 'Ticket not found' });

			// If setting back to open, unassign mentor
			const updates: Record<string, unknown> = {
				resolutionStatus: input.status
			};

			if (input.status === 'open') {
				updates.assignedMentorId = null;
			}

			const [updated] = await context.db.client
				.update(ticket)
				.set(updates)
				.where(eq(ticket.id, input.ticketId))
				.returning();

			return { ticket: updated };
		}),

	/**
	 * Assign/reassign a mentor to a ticket.
	 */
	assignMentor: protectedProcedure
		.input(
			z.object({
				ticketId: z.string(),
				mentorId: z.string()
			})
		)
		.handler(async ({ context, input }) => {
			if (
				!context.user.role ||
				!checkRolePermission({
					roles: context.user.role,
					permissions: { anyTicket: ['update'] }
				})
			) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to assign mentors'
				});
			}

			const { ticket } = context.db.schema;

			const [updated] = await context.db.client
				.update(ticket)
				.set({
					assignedMentorId: input.mentorId,
					resolutionStatus: 'claimed'
				})
				.where(eq(ticket.id, input.ticketId))
				.returning();

			if (!updated) throw new ORPCError('NOT_FOUND', { message: 'Ticket not found' });

			return { ticket: updated };
		})
};

// ─── Admin Endpoints ───────────────────────────────────────────────────

const adminTickets = {
	/**
	 * Hard-delete a ticket.
	 */
	deleteTicket: adminProcedure
		.input(z.object({ ticketId: z.string() }))
		.handler(async ({ context, input }) => {
			const { ticket } = context.db.schema;

			const deleted = await context.db.client
				.delete(ticket)
				.where(eq(ticket.id, input.ticketId))
				.returning();

			if (deleted.length === 0) {
				throw new ORPCError('NOT_FOUND', { message: 'Ticket not found' });
			}
		})
};

// ─── Combined Router ───────────────────────────────────────────────────

export const ticketsRouter = {
	// Competitor
	teamIssues: competitorTickets.teamIssues,
	myTeamTickets: competitorTickets.myTeamTickets,
	create: competitorTickets.create,
	// Mentor
	allTickets: mentorTickets.allTickets,
	myAssignedTickets: mentorTickets.myAssignedTickets,
	claimTicket: mentorTickets.claimTicket,
	updateStatus: mentorTickets.updateStatus,
	assignMentor: mentorTickets.assignMentor,
	// Admin
	deleteTicket: adminTickets.deleteTicket
};
