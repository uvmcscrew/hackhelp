import { protectedProcedure, o } from '../shared';
import { desc, eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { PUBLIC_GITHUB_ORGNAME, PUBLIC_SHOW_CHALLENGES } from '$app/env/public';
import { createTeamSchema, createTicketSchema } from '#lib/schemas';
import type { GithubAppClient } from '#lib/github';
import { MAX_TEAMS_PER_CHALLENGE } from '#lib/utils';
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

	const [team] = await context.db.client
		.select()
		.from(context.db.schema.team)
		.where(eq(context.db.schema.team.id, context.user.teamId));

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
		const members = await context.db.client
			.select({
				id: context.db.schema.user.id,
				username: context.db.schema.user.username,
				fullName: context.db.schema.user.name
			})
			.from(context.db.schema.user)
			.where(eq(context.db.schema.user.teamId, context.team.id))
			.leftJoin(
				context.db.schema.profile,
				eq(context.db.schema.user.id, context.db.schema.profile.id)
			);

		if (context.team.selectedChallengeId === null) {
			return { team: context.team, members, challenge: null };
		}
		const [challenge] = await context.db.client
			.select()
			.from(context.db.schema.challenge)
			.where(eq(context.db.schema.challenge.id, context.team.selectedChallengeId));

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
				org: PUBLIC_GITHUB_ORGNAME!,
				team_slug: context.team.githubSlug!,
				name: input.name,
				description: input.description
			});

			const [team] = await context.db.client
				.update(context.db.schema.team)
				.set({ name: input.name, githubId: ghUpdate.data.id, githubSlug: ghUpdate.data.slug })
				.where(eq(context.db.schema.team.id, context.user.teamId))
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

			const [team] = await context.db.client
				.update(context.db.schema.team)
				.set({ canJoin: input.canJoin })
				.where(eq(context.db.schema.team.id, context.user.teamId))
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
				org: PUBLIC_GITHUB_ORGNAME,
				name: input.name,
				description: input.description
			});

			const [team] = await context.db.client
				.insert(context.db.schema.team)
				.values({
					name: input.name,
					githubId: ghTeam.data.id,
					githubSlug: ghTeam.data.slug
				})
				.returning();

			await context.db.client
				.update(context.db.schema.user)
				.set({ teamId: team.id })
				.where(eq(context.db.schema.user.id, context.user.id));

			await context.githubApp.rest.teams.addOrUpdateMembershipForUserInOrg({
				org: PUBLIC_GITHUB_ORGNAME!,
				team_slug: team.githubSlug!,
				username: context.user.username!
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

			const [team] = await context.db.client
				.select()
				.from(context.db.schema.team)
				.where(eq(context.db.schema.team.joinCode, input.teamJoinCode));

			if (!team) {
				throw new ORPCError('NOT_FOUND', { message: 'Team not found' });
			}

			if (!team.canJoin) {
				throw new ORPCError('FORBIDDEN', { message: 'Team is not accepting new members' });
			}

			await context.db.client
				.update(context.db.schema.user)
				.set({ teamId: team.id })
				.where(eq(context.db.schema.user.id, context.user.id));

			await context.githubApp.rest.teams.addOrUpdateMembershipForUserInOrg({
				org: PUBLIC_GITHUB_ORGNAME!,
				team_slug: team.githubSlug!,
				username: context.user.username!
			});

			return { team };
		}),
	leaveTeam: teamProcedure.route({ method: 'DELETE' }).handler(async ({ context }) => {
		await context.db.client
			.update(context.db.schema.user)
			.set({ teamId: null })
			.where(eq(context.db.schema.user.id, context.user.id));

		await context.githubApp.rest.teams.removeMembershipForUserInOrg({
			org: PUBLIC_GITHUB_ORGNAME!,
			team_slug: context.team.githubSlug!,
			username: context.user.username!
		});

		return { team: context.team };
	}),
	getChallenges: teamProcedure.handler(async ({ context }) => {
		// If challenges are not enabled, return nothing
		if (!PUBLIC_SHOW_CHALLENGES) {
			return { challenges: [] };
		}

		// Get the challenges, including a special field using the sql`` operator to get a count of teams assigned to each challenges
		const challenges = await context.db.client
			.select({
				id: context.db.schema.challenge.id,
				title: context.db.schema.challenge.title,
				linkedRepo: context.db.schema.challenge.linkedRepo,
				teamsAssigned: context.db.client.$count(
					context.db.schema.team,
					eq(context.db.schema.team.selectedChallengeId, context.db.schema.challenge.id)
				)
			})
			.from(context.db.schema.challenge);

		return { challenges };
	}),
	selectChallenge: teamProcedure
		.input(z.object({ challengeId: z.string() }))
		.route({ method: 'POST' })
		.handler(async ({ context, input }) => {
			if (!PUBLIC_SHOW_CHALLENGES) {
				throw new ORPCError('FORBIDDEN', { message: 'Challenges are not enabled' });
			}

			if (context.team.selectedChallengeId !== null) {
				throw new ORPCError('FORBIDDEN', {
					message: 'Team has already selected a challenge'
				});
			}

			const [challenge] = await context.db.client
				.select({
					id: context.db.schema.challenge.id,
					linkedRepo: context.db.schema.challenge.linkedRepo,
					teamsAssigned: context.db.client.$count(
						context.db.schema.team,
						eq(context.db.schema.team.selectedChallengeId, context.db.schema.challenge.id)
					)
				})
				.from(context.db.schema.challenge)
				.where(eq(context.db.schema.challenge.id, input.challengeId));

			if (!challenge) {
				throw new ORPCError('NOT_FOUND', { message: 'Challenge not found' });
			}

			if (challenge.teamsAssigned >= MAX_TEAMS_PER_CHALLENGE) {
				throw new ORPCError('FORBIDDEN', { message: 'Challenge is full' });
			}

			const [team] = await context.db.client
				.update(context.db.schema.team)
				.set({ selectedChallengeId: challenge.id })
				.where(eq(context.db.schema.team.id, context.user.teamId))
				.returning();

			// Permit them to see the challenge repository
			await context.githubApp.rest.teams.addOrUpdateRepoPermissionsInOrg({
				org: PUBLIC_GITHUB_ORGNAME!,
				team_slug: team.githubSlug!,
				owner: PUBLIC_GITHUB_ORGNAME!,
				repo: challenge.linkedRepo!,
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
			org: PUBLIC_GITHUB_ORGNAME!,
			team_slug: teamSlug
		})
	).data.filter((repo) => !repo.name.startsWith('prompt'));
}

const repositoryRouter = {
	getAll: teamProcedure.handler(async ({ context }) => {
		return {
			repos: (await getAllTeamRepositories(context.githubApp, context.team.githubSlug!)).map(
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
				org: PUBLIC_GITHUB_ORGNAME
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
				org: PUBLIC_GITHUB_ORGNAME,
				name: input.repoName,
				description: input.description,
				private: true
			});

			// Update the permissions
			await context.githubApp.rest.teams.addOrUpdateRepoPermissionsInOrg({
				org: PUBLIC_GITHUB_ORGNAME!,
				team_slug: context.team.githubSlug!,
				owner: PUBLIC_GITHUB_ORGNAME!,
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
		const repos = await getAllTeamRepositories(context.githubApp, context.team.githubSlug!);
		const issuesRaw = await Promise.all(
			repos.map(async (repo) => {
				return await context.githubApp.rest.issues.listForRepo({
					owner: PUBLIC_GITHUB_ORGNAME,
					repo: repo.name,
					state: 'open'
				});
			})
		);

		const openTickets = await context.db.client
			.select({
				issueNumber: context.db.schema.ticket.issueNumber,
				repoName: context.db.schema.ticket.repository,
				teamId: context.db.schema.ticket.teamId
			})
			.from(context.db.schema.ticket)
			.where(and(eq(context.db.schema.ticket.teamId, context.team.id)));

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
		const tickets = await context.db.client
			.select({
				id: context.db.schema.ticket.id,
				title: context.db.schema.ticket.title,
				assignedMentorName: context.db.schema.user.name,
				createdAt: context.db.schema.ticket.createdAt,
				resolutionStatus: context.db.schema.ticket.resolutionStatus,
				repository: context.db.schema.ticket.repository,
				issueNumber: context.db.schema.ticket.issueNumber
			})
			.from(context.db.schema.ticket)
			.where(eq(context.db.schema.ticket.teamId, context.team.id))
			.leftJoin(
				context.db.schema.user,
				eq(context.db.schema.ticket.assignedMentorId, context.db.schema.user.id)
			)
			.orderBy(desc(context.db.schema.ticket.createdAt));
		return { tickets };
	}),
	create: teamProcedure
		.input(createTicketSchema)
		.route({ method: 'POST' })
		.handler(async ({ context, input }) => {
			// Create the ticket in the database
			const [ticket] = await context.db.client
				.insert(context.db.schema.ticket)
				.values({
					teamId: context.team.id,
					createdById: context.user.id,
					createdAt: new Date(),
					issueNumber: input.issueNumber,
					repository: input.repository,
					title: input.title
				})
				.returning();

			// Add a comment to the issue
			await context.githubApp.rest.issues.createComment({
				owner: PUBLIC_GITHUB_ORGNAME,
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
