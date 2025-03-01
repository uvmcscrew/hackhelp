import { protectedProcedure, t } from '../shared';
import { desc, eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { serverEnv } from '$lib/env/server';
import { createTeamSchema, createTicketSchema } from '$lib/schemas';
import type { GithubAppClient } from '$lib/github';
import { MAX_TEAMS_PER_CHALLENGE } from '$lib/utils';

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

		if (ctx.team.selectedChallengeId === null) {
			return { team: ctx.team, members, challenge: null };
		}
		const [challenge] = await ctx.db
			.select()
			.from(ctx.dbSchema.challenge)
			.where(eq(ctx.dbSchema.challenge.id, ctx.team.selectedChallengeId));

		return { team: ctx.team, members, challenge };
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
		}),
	updateJoinable: teamProcedure
		.input(z.object({ canJoin: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			if (ctx.team.canJoin === input.canJoin) {
				return { teamIsJoinable: input.canJoin };
			}

			const [team] = await ctx.db
				.update(ctx.dbSchema.team)
				.set({ canJoin: input.canJoin })
				.where(eq(ctx.dbSchema.team.id, ctx.user.teamId))
				.returning();

			if (!team) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
			}

			return { teamIsJoinable: input.canJoin };
		}),
	create: protectedProcedure.input(createTeamSchema).mutation(async ({ ctx, input }) => {
		const ghTeam = await ctx.githubApp.rest.teams.create({
			org: serverEnv.PUBLIC_GITHUB_ORGNAME,
			name: input.name,
			description: input.description
		});

		const [team] = await ctx.db
			.insert(ctx.dbSchema.team)
			.values({
				name: input.name,
				githubId: ghTeam.data.id,
				githubSlug: ghTeam.data.slug
			})
			.returning();

		await ctx.db
			.update(ctx.dbSchema.user)
			.set({ teamId: team.id })
			.where(eq(ctx.dbSchema.user.id, ctx.user.id));

		await ctx.githubApp.rest.teams.addOrUpdateMembershipForUserInOrg({
			org: serverEnv.PUBLIC_GITHUB_ORGNAME,
			team_slug: team.githubSlug,
			username: ctx.user.username
		});

		return { team };
	}),
	joinTeam: protectedProcedure
		.input(z.object({ teamJoinCode: z.string().nonempty().max(6).min(6) }))
		.mutation(async ({ ctx, input }) => {
			if (ctx.user.teamId !== null) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'User is already in a team' });
			}

			const [team] = await ctx.db
				.select()
				.from(ctx.dbSchema.team)
				.where(eq(ctx.dbSchema.team.joinCode, input.teamJoinCode));

			if (!team) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
			}

			if (!team.canJoin) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Team is not accepting new members' });
			}

			await ctx.db
				.update(ctx.dbSchema.user)
				.set({ teamId: team.id })
				.where(eq(ctx.dbSchema.user.id, ctx.user.id));

			await ctx.githubApp.rest.teams.addOrUpdateMembershipForUserInOrg({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				team_slug: team.githubSlug,
				username: ctx.user.username
			});

			return { team };
		}),
	leaveTeam: teamProcedure.mutation(async ({ ctx }) => {
		await ctx.db
			.update(ctx.dbSchema.user)
			.set({ teamId: null })
			.where(eq(ctx.dbSchema.user.id, ctx.user.id));

		await ctx.githubApp.rest.teams.removeMembershipForUserInOrg({
			org: serverEnv.PUBLIC_GITHUB_ORGNAME,
			team_slug: ctx.team.githubSlug,
			username: ctx.user.username
		});

		return { team: ctx.team };
	}),
	getChallenges: teamProcedure.query(async ({ ctx }) => {
		// If challenges are not enabled, return nothing
		if (!serverEnv.PUBLIC_SHOW_CHALLENGES) {
			return { challenges: [] };
		}

		// Get the challenges, including a special field using the sql`` operator to get a count of teams assigned to each challenges
		const challenges = await ctx.db
			.select({
				id: ctx.dbSchema.challenge.id,
				title: ctx.dbSchema.challenge.title,
				linkedRepo: ctx.dbSchema.challenge.linkedRepo,
				teamsAssigned: ctx.db.$count(
					ctx.dbSchema.team,
					eq(ctx.dbSchema.team.selectedChallengeId, ctx.dbSchema.challenge.id)
				)
			})
			.from(ctx.dbSchema.challenge);

		return { challenges };
	}),
	selectChallenge: teamProcedure
		.input(z.object({ challengeId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			if (!serverEnv.PUBLIC_SHOW_CHALLENGES) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Challenges are not enabled' });
			}

			if (ctx.team.selectedChallengeId !== null) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Team has already selected a challenge'
				});
			}

			const [challenge] = await ctx.db
				.select({
					id: ctx.dbSchema.challenge.id,
					linkedRepo: ctx.dbSchema.challenge.linkedRepo,
					teamsAssigned: ctx.db.$count(
						ctx.dbSchema.team,
						eq(ctx.dbSchema.team.selectedChallengeId, ctx.dbSchema.challenge.id)
					)
				})
				.from(ctx.dbSchema.challenge)
				.where(eq(ctx.dbSchema.challenge.id, input.challengeId));

			if (!challenge) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Challenge not found' });
			}

			if (challenge.teamsAssigned >= MAX_TEAMS_PER_CHALLENGE) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'Challenge is full' });
			}

			const [team] = await ctx.db
				.update(ctx.dbSchema.team)
				.set({ selectedChallengeId: challenge.id })
				.where(eq(ctx.dbSchema.team.id, ctx.user.teamId))
				.returning();

			// Permit them to see the challenge repository
			await ctx.githubApp.rest.teams.addOrUpdateRepoPermissionsInOrg({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				team_slug: team.githubSlug,
				owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
				repo: challenge.linkedRepo,
				permission: 'pull'
			});

			return { team };
		})
});

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

const repositoryRouter = t.router({
	getAll: teamProcedure.query(async ({ ctx }) => {
		return {
			repos: (await getAllTeamRepositories(ctx.githubApp, ctx.team.githubSlug)).map((repo) => {
				return {
					id: repo.id,
					name: repo.name,
					fullName: repo.full_name,
					description: repo.description,
					private: repo.private,
					htmlUrl: repo.html_url,
					language: repo.language
				};
			})
		};
	}),
	repoSlugIsTaken: teamProcedure
		.input(z.object({ repoName: z.string().nonempty() }))
		.query(async ({ ctx, input }) => {
			const repos = await ctx.githubApp.rest.repos.listForOrg({
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
		.mutation(async ({ ctx, input }) => {
			// Create the repository
			const ghRepo = await ctx.githubApp.rest.repos.createInOrg({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				name: input.repoName,
				description: input.description,
				private: true
			});

			// Update the permissions
			await ctx.githubApp.rest.teams.addOrUpdateRepoPermissionsInOrg({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				team_slug: ctx.team.githubSlug,
				owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
				repo: ghRepo.data.name,
				permission: 'admin'
			});
		})
});

// #############################################
// #              TICKET ROUTER                #
// #############################################

export type IssueReturn = {
	id: number;
	title: string;
	repoName: string;
	issueNumber: number;
};

const ticketRouter = t.router({
	getAllTeamIssues: teamProcedure.query(async ({ ctx }) => {
		const repos = await getAllTeamRepositories(ctx.githubApp, ctx.team.githubSlug);
		const issuesRaw = await Promise.all(
			repos.map(async (repo) => {
				return await ctx.githubApp.rest.issues.listForRepo({
					owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
					repo: repo.name,
					state: 'open'
				});
			})
		);

		const openTickets = await ctx.db
			.select({
				issueNumber: ctx.dbSchema.ticket.issueNumber,
				repoName: ctx.dbSchema.ticket.repository,
				teamId: ctx.dbSchema.ticket.teamId
			})
			.from(ctx.dbSchema.ticket)
			.where(and(eq(ctx.dbSchema.ticket.teamId, ctx.team.id)));

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
	getTickets: teamProcedure.query(async ({ ctx }) => {
		const tickets = await ctx.db
			.select({
				id: ctx.dbSchema.ticket.id,
				title: ctx.dbSchema.ticket.title,
				assignedMentorName: ctx.dbSchema.user.fullName,
				createdAt: ctx.dbSchema.ticket.createdAt,
				resolutionStatus: ctx.dbSchema.ticket.resolutionStatus,
				repository: ctx.dbSchema.ticket.repository,
				issueNumber: ctx.dbSchema.ticket.issueNumber
			})
			.from(ctx.dbSchema.ticket)
			.where(eq(ctx.dbSchema.ticket.teamId, ctx.team.id))
			.leftJoin(ctx.dbSchema.user, eq(ctx.dbSchema.ticket.assignedMentor, ctx.dbSchema.user.id))
			.orderBy(desc(ctx.dbSchema.ticket.createdAt));
		return { tickets };
	}),
	create: teamProcedure.input(createTicketSchema).mutation(async ({ ctx, input }) => {
		// Create the ticket in the database
		const [ticket] = await ctx.db
			.insert(ctx.dbSchema.ticket)
			.values({
				teamId: ctx.team.id,
				challengeId: ctx.team.selectedChallengeId,
				createdAt: new Date(),
				issueNumber: input.issueNumber,
				repository: input.repository,
				title: input.title,
				location: input.location,
				locationDescription: input.locationDescription
			})
			.returning();

		// Add a comment to the issue
		await ctx.githubApp.rest.issues.createComment({
			owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
			repo: input.repository,
			issue_number: input.issueNumber,
			body: `This issue has been linked to a ticket.`
		});

		return { ticket };
	})
});

// #############################################
// #            COMPETITOR ROUTER              #
// #############################################

export const competitorRouter = t.router({
	tickets: ticketRouter,
	team: teamRouter,
	repositories: repositoryRouter
});
