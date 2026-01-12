import { protectedProcedure, o } from '../shared';
import { desc, eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { serverEnv } from '$lib/env/server';
import { createTeamSchema, createTicketSchema } from '$lib/schemas';
import type { GithubAppClient } from '$lib/github';
import { MAX_TEAMS_PER_CHALLENGE } from '$lib/utils';
import { ORPCError } from '@orpc/client';

/**
 * This file contains most actions that a competitor will need. It is broken out into multiple routers depending on what the different actions
 * pertain to. These actions include; creating their team, updating it, creating tickets, updating tickets, handling repositories, etc.
 */

const enforceUserIsInTeam = o.middleware(async ({ context, next }) => {
	if (!context.user || !context.session) {
		throw new ORPCError('UNAUTHORIZED');
	}

	if (!context.user.teamId) {
		throw new ORPCError('FORBIDDEN');
	}

	const [team] = await context.db
		.select()
		.from(context.dbSchema.team)
		.where(eq(context.dbSchema.team.id, context.user.teamId));

	if (!team) {
		throw new ORPCError('NOT_FOUND', { message: 'Team not found' });
	}

	return next({
		context: {
			user: { ...context.user, teamId: context.user.teamId },
			session: context.session,
			team
		}
	});
});

const teamProcedure = protectedProcedure.use(enforceUserIsInTeam);

// #############################################
// #               TEAM ROUTER                 #
// #############################################

const teamRouter = {
	getTeam: teamProcedure.handler(async ({ context }) => {
		const members = await context.db
			.select({
				id: context.dbSchema.user.id,
				username: context.dbSchema.user.username,
				fullName: context.dbSchema.user.fullName
			})
			.from(context.dbSchema.user)
			.where(eq(context.dbSchema.user.teamId, context.team.id))
			.leftJoin(
				context.dbSchema.profile,
				eq(context.dbSchema.user.id, context.dbSchema.profile.linkedUserId)
			);

		if (context.team.selectedChallengeId === null) {
			return { team: context.team, members, challenge: null };
		}
		const [challenge] = await context.db
			.select()
			.from(context.dbSchema.challenge)
			.where(eq(context.dbSchema.challenge.id, context.team.selectedChallengeId));

		return { team: context.team, members, challenge };
	}),
	updateProperties: teamProcedure
		.input(
			z.object({
				name: z.string().nonempty(),
				description: z.string().default('')
			})
		)
		.route({ method: 'POST' })
		.handler(async ({ context, input }) => {
			const ghUpdate = await context.githubApp.rest.teams.updateInOrg({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				team_slug: context.team.githubSlug,
				name: input.name,
				description: input.description
			});

			const [team] = await context.db
				.update(context.dbSchema.team)
				.set({ name: input.name, githubId: ghUpdate.data.id, githubSlug: ghUpdate.data.slug })
				.where(eq(context.dbSchema.team.id, context.user.teamId))
				.returning();
			if (!team) {
				throw new ORPCError('NOT_FOUND', { message: 'Team not found' });
			}
			return { team };
		}),
	updateJoinable: teamProcedure
		.input(z.object({ canJoin: z.boolean() }))
		.route({ method: 'POST' })
		.handler(async ({ context, input }) => {
			if (context.team.canJoin === input.canJoin) {
				return { teamIsJoinable: input.canJoin };
			}

			const [team] = await context.db
				.update(context.dbSchema.team)
				.set({ canJoin: input.canJoin })
				.where(eq(context.dbSchema.team.id, context.user.teamId))
				.returning();

			if (!team) {
				throw new ORPCError('NOT_FOUND', { message: 'Team not found' });
			}

			return { teamIsJoinable: input.canJoin };
		}),
	create: protectedProcedure
		.input(createTeamSchema)
		.route({ method: 'POST' })
		.handler(async ({ context, input }) => {
			const ghTeam = await context.githubApp.rest.teams.create({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				name: input.name,
				description: input.description
			});

			const [team] = await context.db
				.insert(context.dbSchema.team)
				.values({
					name: input.name,
					githubId: ghTeam.data.id,
					githubSlug: ghTeam.data.slug
				})
				.returning();

			await context.db
				.update(context.dbSchema.user)
				.set({ teamId: team.id })
				.where(eq(context.dbSchema.user.id, context.user.id));

			await context.githubApp.rest.teams.addOrUpdateMembershipForUserInOrg({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				team_slug: team.githubSlug,
				username: context.user.username
			});

			return { team };
		}),
	joinTeamMutation: protectedProcedure
		.input(z.object({ teamJoinCode: z.string().nonempty().max(6).min(6) }))
		.route({ method: 'POST' })
		.handler(async ({ context, input }) => {
			if (context.user.teamId !== null) {
				throw new ORPCError('FORBIDDEN', { message: 'User is already in a team' });
			}

			const [team] = await context.db
				.select()
				.from(context.dbSchema.team)
				.where(eq(context.dbSchema.team.joinCode, input.teamJoinCode));

			if (!team) {
				throw new ORPCError('NOT_FOUND', { message: 'Team not found' });
			}

			if (!team.canJoin) {
				throw new ORPCError('FORBIDDEN', { message: 'Team is not accepting new members' });
			}

			await context.db
				.update(context.dbSchema.user)
				.set({ teamId: team.id })
				.where(eq(context.dbSchema.user.id, context.user.id));

			await context.githubApp.rest.teams.addOrUpdateMembershipForUserInOrg({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				team_slug: team.githubSlug,
				username: context.user.username
			});

			return { team };
		}),
	leaveTeam: teamProcedure.route({ method: 'DELETE' }).handler(async ({ context }) => {
		await context.db
			.update(context.dbSchema.user)
			.set({ teamId: null })
			.where(eq(context.dbSchema.user.id, context.user.id));

		await context.githubApp.rest.teams.removeMembershipForUserInOrg({
			org: serverEnv.PUBLIC_GITHUB_ORGNAME,
			team_slug: context.team.githubSlug,
			username: context.user.username
		});

		return { team: context.team };
	}),
	getChallenges: teamProcedure.handler(async ({ context }) => {
		// If challenges are not enabled, return nothing
		if (!serverEnv.PUBLIC_SHOW_CHALLENGES) {
			return { challenges: [] };
		}

		// Get the challenges, including a special field using the sql`` operator to get a count of teams assigned to each challenges
		const challenges = await context.db
			.select({
				id: context.dbSchema.challenge.id,
				title: context.dbSchema.challenge.title,
				linkedRepo: context.dbSchema.challenge.linkedRepo,
				teamsAssigned: context.db.$count(
					context.dbSchema.team,
					eq(context.dbSchema.team.selectedChallengeId, context.dbSchema.challenge.id)
				)
			})
			.from(context.dbSchema.challenge);

		return { challenges };
	}),
	selectChallenge: teamProcedure
		.input(z.object({ challengeId: z.string() }))
		.route({ method: 'POST' })
		.handler(async ({ context, input }) => {
			if (!serverEnv.PUBLIC_SHOW_CHALLENGES) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Challenges are not enabled' });
			}

			if (context.team.selectedChallengeId !== null) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Team has already selected a challenge'
				});
			}

			const [challenge] = await context.db
				.select({
					id: context.dbSchema.challenge.id,
					linkedRepo: context.dbSchema.challenge.linkedRepo,
					teamsAssigned: context.db.$count(
						context.dbSchema.team,
						eq(context.dbSchema.team.selectedChallengeId, context.dbSchema.challenge.id)
					)
				})
				.from(context.dbSchema.challenge)
				.where(eq(context.dbSchema.challenge.id, input.challengeId));

			if (!challenge) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Challenge not found' });
			}

			if (challenge.teamsAssigned >= MAX_TEAMS_PER_CHALLENGE) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Challenge is full' });
			}

			const [team] = await context.db
				.update(context.dbSchema.team)
				.set({ selectedChallengeId: challenge.id })
				.where(eq(context.dbSchema.team.id, context.user.teamId))
				.returning();

			// Permit them to see the challenge repository
			await context.githubApp.rest.teams.addOrUpdateRepoPermissionsInOrg({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				team_slug: team.githubSlug,
				owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
				repo: challenge.linkedRepo,
				permission: 'pull'
			});

			return { team };
		})
};

// #############################################
// #            REPOSITORY ROUTER              #
// #############################################

async function getAllTeamRepositories(githubApp: GithubAppClient, teamSlug: string) {
	return (
		await githubApp.rest.teams.listReposInOrg({
			org: serverEnv.PUBLIC_GITHUB_ORGNAME,
			team_slug: teamSlug
		})
	).data.filter((repo) => !repo.name.startsWith('prompt'));
}

const repositoryRouter = {
	getAll: teamProcedure.handler(async ({ context }) => {
		return {
			repos: (await getAllTeamRepositories(context.githubApp, context.team.githubSlug)).map(
				(repo) => {
					return {
						id: repo.id,
						name: repo.name,
						fullName: repo.full_name,
						description: repo.description,
						private: repo.private,
						htmlUrl: repo.html_url,
						language: repo.language
					};
				}
			)
		};
	}),
	repoSlugIsTaken: teamProcedure
		.input(z.object({ repoName: z.string().nonempty() }))
		.handler(async ({ context, input }) => {
			const repos = await context.githubApp.rest.repos.listForOrg({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME
			});
			return { repoExists: repos.data.some((repo) => repo.name === input.repoName) };
		}),
	create: teamProcedure
		.input(
			z.object({
				repoName: z.string().nonempty(),
				description: z.string().default('')
			})
		)
		.handler(async ({ context, input }) => {
			// Create the repository
			const ghRepo = await context.githubApp.rest.repos.createInOrg({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				name: input.repoName,
				description: input.description,
				private: true
			});

			// Update the permissions
			await context.githubApp.rest.teams.addOrUpdateRepoPermissionsInOrg({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				team_slug: context.team.githubSlug,
				owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
				repo: ghRepo.data.name,
				permission: 'admin'
			});
		})
};

// #############################################
// #              TICKET ROUTER                #
// #############################################

export type IssueReturn = {
	id: number;
	title: string;
	repoName: string;
	issueNumber: number;
};

const ticketRouter = {
	getAllTeamIssues: teamProcedure.handler(async ({ context }) => {
		const repos = await getAllTeamRepositories(context.githubApp, context.team.githubSlug);
		const issuesRaw = await Promise.all(
			repos.map(async (repo) => {
				return await context.githubApp.rest.issues.listForRepo({
					owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
					repo: repo.name,
					state: 'open'
				});
			})
		);

		const openTickets = await context.db
			.select({
				issueNumber: context.dbSchema.ticket.issueNumber,
				repoName: context.dbSchema.ticket.repository,
				teamId: context.dbSchema.ticket.teamId
			})
			.from(context.dbSchema.ticket)
			.where(and(eq(context.dbSchema.ticket.teamId, context.team.id)));

		// Filter out issues that are already linked to tickets

		const issues = issuesRaw
			.flatMap((issue) => issue.data)
			.filter((issue) => {
				return !openTickets.some(
					(ticket) =>
						ticket.issueNumber === issue.number &&
						ticket.repoName === issue.repository_url.split('/').pop()
				);
			});

		return {
			issues: issues.map(
				(issue) =>
					({
						id: issue.id,
						title: issue.title,
						repoName: issue.repository_url.split('/').pop() ?? '',
						issueNumber: issue.number
					}) satisfies IssueReturn
			)
		};
	}),
	getTickets: teamProcedure.handler(async ({ context }) => {
		const tickets = await context.db
			.select({
				id: context.dbSchema.ticket.id,
				title: context.dbSchema.ticket.title,
				assignedMentorName: context.dbSchema.user.fullName,
				createdAt: context.dbSchema.ticket.createdAt,
				resolutionStatus: context.dbSchema.ticket.resolutionStatus,
				repository: context.dbSchema.ticket.repository,
				issueNumber: context.dbSchema.ticket.issueNumber
			})
			.from(context.dbSchema.ticket)
			.where(eq(context.dbSchema.ticket.teamId, context.team.id))
			.leftJoin(
				context.dbSchema.user,
				eq(context.dbSchema.ticket.assignedMentor, context.dbSchema.user.id)
			)
			.orderBy(desc(context.dbSchema.ticket.createdAt));
		return { tickets };
	}),
	create: teamProcedure
		.input(createTicketSchema)
		.route({ method: 'POST' })
		.handler(async ({ context, input }) => {
			// Create the ticket in the database
			const [ticket] = await context.db
				.insert(context.dbSchema.ticket)
				.values({
					teamId: context.team.id,
					challengeId: context.team.selectedChallengeId,
					createdAt: new Date(),
					issueNumber: input.issueNumber,
					repository: input.repository,
					title: input.title,
					location: input.location,
					locationDescription: input.locationDescription
				})
				.returning();

			// Add a comment to the issue
			await context.githubApp.rest.issues.createComment({
				owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
				repo: input.repository,
				issue_number: input.issueNumber,
				body: `This issue has been linked to a ticket.`
			});

			return { ticket };
		})
};

// #############################################
// #            COMPETITOR ROUTER              #
// #############################################

export const competitorRouter = {
	tickets: ticketRouter,
	team: teamRouter,
	repositories: repositoryRouter
};
