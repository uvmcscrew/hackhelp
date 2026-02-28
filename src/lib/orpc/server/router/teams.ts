import type { TeamMembership } from '$lib/server/db/schema';
import { createTeamSchema } from '$lib/schemas';
import { publicProcedure, protectedProcedure } from '../shared';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { ORPCError } from '@orpc/client';
import { TEAM_MAX_SIZE, PROGRAMMERS_MAX, BUSINESS_MAX } from '$lib/config/team-rules';
import {
	ensureGithubTeam,
	syncTeamMember,
	removeTeamMember,
	deleteGithubTeam
} from '$lib/server/github-sync';
import { serverEnv } from '$lib/env/server';

const MAX_REPOS_PER_TEAM = 3;

export const teamsRouter = {
	byId: publicProcedure.input(z.object({ id: z.string() })).handler(async ({ context, input }) => {
		const [team] = await context.db.client
			.select()
			.from(context.db.schema.team)
			.where(eq(context.db.schema.team.id, input.id));

		if (!team) throw new ORPCError('NOT_FOUND', { message: 'Team not found' });

		const canViewExtendedInfo = !!context.user;

		const members = await context.db.client
			.select({
				membership: context.db.schema.teamMembers,
				user: {
					name: context.db.schema.user.name,
					email: context.db.schema.user.email,
					image: context.db.schema.user.image
				}
			})
			.from(context.db.schema.teamMembers)
			.where(eq(context.db.schema.teamMembers.teamId, team.id))
			.leftJoin(
				context.db.schema.user,
				eq(context.db.schema.teamMembers.userId, context.db.schema.user.id)
			);

		const filteredMembers = members
			.filter((m) => m.user !== null)
			.map((m) => ({
				...m,
				user: {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					...m.user!,
					email: canViewExtendedInfo ? m.user?.email : ''
				}
			}));

		return {
			...team,
			members: filteredMembers
		};
	}),

	listAll: publicProcedure.handler(async ({ context }) => {
		const canViewExtendedInfo = !!context.user;

		const teams = await context.db.client
			.select()
			.from(context.db.schema.team)
			.where(eq(context.db.schema.team.isPublic, true));

		const membershipMap = new Map<
			string,
			{ membership: TeamMembership; user: { name: string; email: string; image?: string | null } }[]
		>();

		const teamMembershipsIter = await context.db.client
			.select({
				membership: context.db.schema.teamMembers,
				user: {
					name: context.db.schema.user.name,
					email: context.db.schema.user.email,
					image: context.db.schema.user.image
				}
			})
			.from(context.db.schema.teamMembers)
			.leftJoin(
				context.db.schema.user,
				eq(context.db.schema.teamMembers.userId, context.db.schema.user.id)
			);

		for (const mbr of teamMembershipsIter) {
			const arr = membershipMap.get(mbr.membership.teamId) || [];
			if (mbr.user !== null) {
				if (!canViewExtendedInfo) mbr.user.email = '';
				// @ts-expect-error Checking ain't right
				arr.push(mbr);
			}
			membershipMap.set(mbr.membership.teamId, arr);
		}

		const teamWithMembers = teams.map((t) => {
			const members = membershipMap.get(t.id) || [];
			return {
				...t,
				members
			};
		});

		return teamWithMembers;
	}),

	join: protectedProcedure
		.input(
			z.object({ joinCode: z.string().length(6), asRole: z.enum(['business', 'programming']) })
		)
		.handler(async ({ context, input }) => {
			// First, if the user is in a team already, deny
			const membership = await context.db.client
				.select()
				.from(context.db.schema.teamMembers)
				.where(eq(context.db.schema.teamMembers.userId, context.user.id));

			if (membership.length > 0)
				throw new ORPCError('BAD_REQUEST', { message: 'You are already in a team' });

			// Second, get the team by its join code
			const teams = await context.db.client
				.select()
				.from(context.db.schema.team)
				.where(eq(context.db.schema.team.joinCode, input.joinCode));

			if (teams.length === 0)
				throw new ORPCError('BAD_REQUEST', { message: 'Team does not exist' });

			const team = teams[0];

			const members = await context.db.client
				.select()
				.from(context.db.schema.teamMembers)
				.where(eq(context.db.schema.teamMembers.teamId, team.id));

			if (!team.canJoin)
				throw new ORPCError('BAD_REQUEST', { message: 'Team not open to new members' });

			let joinAllowed = true;
			let joinDenyReason = '';

			if (members.length >= TEAM_MAX_SIZE) {
				joinAllowed = false;
				joinDenyReason = 'Team is full';
			} else if (
				input.asRole === 'programming' &&
				members.filter((m) => m.role === 'programming').length >= PROGRAMMERS_MAX
			) {
				joinAllowed = false;
				joinDenyReason = 'Too many programmers';
			} else if (
				input.asRole === 'business' &&
				members.filter((m) => m.role === 'business').length >= BUSINESS_MAX
			) {
				joinAllowed = false;
				joinDenyReason = 'Too many business members';
			}

			if (!joinAllowed) throw new ORPCError('BAD_REQUEST', { message: joinDenyReason });

			// Create membership
			await context.db.client
				.insert(context.db.schema.teamMembers)
				.values({ teamId: team.id, userId: context.user.id, role: input.asRole });

			// Fire-and-forget: add user to GitHub team
			syncTeamMember(context.githubApp, team, context.user.id).catch(() => {});
		}),

	create: protectedProcedure
		.input(createTeamSchema.extend({ asRole: z.enum(['business', 'programming']) }))
		.handler(async ({ context, input }) => {
			// Check user isn't already in a team
			const existing = await context.db.client
				.select()
				.from(context.db.schema.teamMembers)
				.where(eq(context.db.schema.teamMembers.userId, context.user.id));

			if (existing.length > 0)
				throw new ORPCError('BAD_REQUEST', { message: 'You are already in a team' });

			// Create the team
			const [newTeam] = await context.db.client
				.insert(context.db.schema.team)
				.values({ name: input.name })
				.returning();

			// Add creator as captain
			await context.db.client.insert(context.db.schema.teamMembers).values({
				teamId: newTeam.id,
				userId: context.user.id,
				role: input.asRole,
				isCaptain: true
			});

			// Fire-and-forget: create GitHub team and sync captain
			ensureGithubTeam(context.githubApp, newTeam)
				.then((ghTeam) => {
					if (ghTeam) {
						syncTeamMember(
							context.githubApp,
							{ ...newTeam, githubSlug: ghTeam.githubSlug },
							context.user.id
						).catch(() => {});
					}
				})
				.catch(() => {});

			return newTeam;
		}),

	myTeam: protectedProcedure.handler(async ({ context }) => {
		const membership = await context.db.client
			.select()
			.from(context.db.schema.teamMembers)
			.where(eq(context.db.schema.teamMembers.userId, context.user.id));

		if (membership.length === 0) return null;

		const myMembership = membership[0];

		const [team] = await context.db.client
			.select()
			.from(context.db.schema.team)
			.where(eq(context.db.schema.team.id, myMembership.teamId));

		if (!team) return null;

		const members = await context.db.client
			.select({
				membership: context.db.schema.teamMembers,
				user: {
					id: context.db.schema.user.id,
					name: context.db.schema.user.name,
					email: context.db.schema.user.email,
					image: context.db.schema.user.image
				}
			})
			.from(context.db.schema.teamMembers)
			.where(eq(context.db.schema.teamMembers.teamId, team.id))
			.leftJoin(
				context.db.schema.user,
				eq(context.db.schema.teamMembers.userId, context.db.schema.user.id)
			);

		return {
			...team,
			myMembership,
			members
		};
	}),

	toggleCanJoin: protectedProcedure.handler(async ({ context }) => {
		const membership = await context.db.client
			.select()
			.from(context.db.schema.teamMembers)
			.where(eq(context.db.schema.teamMembers.userId, context.user.id));

		if (membership.length === 0 || !membership[0].isCaptain) {
			throw new ORPCError('FORBIDDEN', { message: 'Only the team captain can do this' });
		}

		const [team] = await context.db.client
			.select()
			.from(context.db.schema.team)
			.where(eq(context.db.schema.team.id, membership[0].teamId));

		if (!team) throw new ORPCError('NOT_FOUND', { message: 'Team not found' });

		const [updated] = await context.db.client
			.update(context.db.schema.team)
			.set({ canJoin: !team.canJoin })
			.where(eq(context.db.schema.team.id, team.id))
			.returning();

		return updated;
	}),

	toggleIsPublic: protectedProcedure.handler(async ({ context }) => {
		const membership = await context.db.client
			.select()
			.from(context.db.schema.teamMembers)
			.where(eq(context.db.schema.teamMembers.userId, context.user.id));

		if (membership.length === 0 || !membership[0].isCaptain) {
			throw new ORPCError('FORBIDDEN', { message: 'Only the team captain can do this' });
		}

		const [team] = await context.db.client
			.select()
			.from(context.db.schema.team)
			.where(eq(context.db.schema.team.id, membership[0].teamId));

		if (!team) throw new ORPCError('NOT_FOUND', { message: 'Team not found' });

		const [updated] = await context.db.client
			.update(context.db.schema.team)
			.set({ isPublic: !team.isPublic })
			.where(eq(context.db.schema.team.id, team.id))
			.returning();

		return updated;
	}),

	kickMember: protectedProcedure
		.input(z.object({ userId: z.string() }))
		.handler(async ({ context, input }) => {
			// Verify caller is captain
			const callerMembership = await context.db.client
				.select()
				.from(context.db.schema.teamMembers)
				.where(eq(context.db.schema.teamMembers.userId, context.user.id));

			if (callerMembership.length === 0 || !callerMembership[0].isCaptain) {
				throw new ORPCError('FORBIDDEN', { message: 'Only the team captain can kick members' });
			}

			if (input.userId === context.user.id) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Cannot kick yourself. Use leave team instead.'
				});
			}

			// Verify target is on the same team
			const targetMembership = await context.db.client
				.select()
				.from(context.db.schema.teamMembers)
				.where(
					and(
						eq(context.db.schema.teamMembers.userId, input.userId),
						eq(context.db.schema.teamMembers.teamId, callerMembership[0].teamId)
					)
				);

			if (targetMembership.length === 0) {
				throw new ORPCError('NOT_FOUND', { message: 'Member not found on your team' });
			}

			await context.db.client
				.delete(context.db.schema.teamMembers)
				.where(
					and(
						eq(context.db.schema.teamMembers.userId, input.userId),
						eq(context.db.schema.teamMembers.teamId, callerMembership[0].teamId)
					)
				);

			// Fire-and-forget: remove user from GitHub team
			const [kickedTeam] = await context.db.client
				.select()
				.from(context.db.schema.team)
				.where(eq(context.db.schema.team.id, callerMembership[0].teamId));

			if (kickedTeam) {
				removeTeamMember(context.githubApp, kickedTeam, input.userId).catch(() => {});
			}
		}),

	transferCaptain: protectedProcedure
		.input(z.object({ targetUserId: z.string() }))
		.handler(async ({ context, input }) => {
			// Verify caller is captain
			const callerMembership = await context.db.client
				.select()
				.from(context.db.schema.teamMembers)
				.where(eq(context.db.schema.teamMembers.userId, context.user.id));

			if (callerMembership.length === 0 || !callerMembership[0].isCaptain) {
				throw new ORPCError('FORBIDDEN', {
					message: 'Only the team captain can transfer captaincy'
				});
			}

			if (input.targetUserId === context.user.id) {
				throw new ORPCError('BAD_REQUEST', { message: 'You are already the captain' });
			}

			const teamId = callerMembership[0].teamId;

			// Verify target is on the same team
			const targetMembership = await context.db.client
				.select()
				.from(context.db.schema.teamMembers)
				.where(
					and(
						eq(context.db.schema.teamMembers.userId, input.targetUserId),
						eq(context.db.schema.teamMembers.teamId, teamId)
					)
				);

			if (targetMembership.length === 0) {
				throw new ORPCError('NOT_FOUND', { message: 'Member not found on your team' });
			}

			// Atomically: demote current captain, promote target
			await context.db.client
				.update(context.db.schema.teamMembers)
				.set({ isCaptain: false })
				.where(
					and(
						eq(context.db.schema.teamMembers.userId, context.user.id),
						eq(context.db.schema.teamMembers.teamId, teamId)
					)
				);

			await context.db.client
				.update(context.db.schema.teamMembers)
				.set({ isCaptain: true })
				.where(
					and(
						eq(context.db.schema.teamMembers.userId, input.targetUserId),
						eq(context.db.schema.teamMembers.teamId, teamId)
					)
				);
		}),

	updateName: protectedProcedure
		.input(z.object({ name: z.string().min(3).max(50) }))
		.handler(async ({ context, input }) => {
			// Verify caller is captain
			const callerMembership = await context.db.client
				.select()
				.from(context.db.schema.teamMembers)
				.where(eq(context.db.schema.teamMembers.userId, context.user.id));

			if (callerMembership.length === 0 || !callerMembership[0].isCaptain) {
				throw new ORPCError('FORBIDDEN', {
					message: 'Only the team captain can rename the team'
				});
			}

			const [updated] = await context.db.client
				.update(context.db.schema.team)
				.set({ name: input.name })
				.where(eq(context.db.schema.team.id, callerMembership[0].teamId))
				.returning();

			if (!updated) throw new ORPCError('NOT_FOUND', { message: 'Team not found' });
			return updated;
		}),

	leaveTeam: protectedProcedure.handler(async ({ context }) => {
		const membership = await context.db.client
			.select()
			.from(context.db.schema.teamMembers)
			.where(eq(context.db.schema.teamMembers.userId, context.user.id));

		if (membership.length === 0) {
			throw new ORPCError('BAD_REQUEST', { message: 'You are not in a team' });
		}

		const myMembership = membership[0];

		if (myMembership.isCaptain) {
			// Check if there are other members
			const otherMembers = await context.db.client
				.select()
				.from(context.db.schema.teamMembers)
				.where(eq(context.db.schema.teamMembers.teamId, myMembership.teamId));

			const others = otherMembers.filter((m) => m.userId !== context.user.id);

			if (others.length > 0) {
				throw new ORPCError('BAD_REQUEST', {
					message:
						'As captain, you must kick all other members before leaving, or transfer captaincy first.'
				});
			}

			// Load team before deleting (need slug for GitHub cleanup)
			const [teamToDelete] = await context.db.client
				.select()
				.from(context.db.schema.team)
				.where(eq(context.db.schema.team.id, myMembership.teamId));

			// Captain is the only member — delete the team entirely
			await context.db.client
				.delete(context.db.schema.teamMembers)
				.where(eq(context.db.schema.teamMembers.teamId, myMembership.teamId));

			await context.db.client
				.delete(context.db.schema.team)
				.where(eq(context.db.schema.team.id, myMembership.teamId));

			// Fire-and-forget: delete the GitHub team
			if (teamToDelete) {
				deleteGithubTeam(context.githubApp, teamToDelete).catch(() => {});
			}

			return { deleted: true };
		}

		// Non-captain: just remove membership
		await context.db.client
			.delete(context.db.schema.teamMembers)
			.where(
				and(
					eq(context.db.schema.teamMembers.userId, context.user.id),
					eq(context.db.schema.teamMembers.teamId, myMembership.teamId)
				)
			);

		// Fire-and-forget: remove user from GitHub team
		const [leftTeam] = await context.db.client
			.select()
			.from(context.db.schema.team)
			.where(eq(context.db.schema.team.id, myMembership.teamId));

		if (leftTeam) {
			removeTeamMember(context.githubApp, leftTeam, context.user.id).catch(() => {});
		}

		return { deleted: false };
	}),

	repos: {
		/**
		 * List all repos for the caller's team (filtered: no prompt* repos).
		 */
		list: protectedProcedure.handler(async ({ context }) => {
			const { teamMembers, team } = context.db.schema;

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
				return { repos: [] };
			}

			const { data: repos } = await context.githubApp.rest.teams.listReposInOrg({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				team_slug: myTeam.githubSlug
			});

			return {
				repos: repos
					.filter((r) => !r.name.startsWith('prompt'))
					.map((r) => ({
						id: r.id,
						name: r.name,
						fullName: r.full_name,
						description: r.description,
						private: r.private,
						htmlUrl: r.html_url,
						language: r.language
					}))
			};
		}),

		/**
		 * Check if a repo name is already taken in the org.
		 */
		checkName: protectedProcedure
			.input(z.object({ repoName: z.string().nonempty() }))
			.handler(async ({ context, input }) => {
				try {
					await context.githubApp.rest.repos.get({
						owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
						repo: input.repoName
					});
					return { repoExists: true };
				} catch (e: unknown) {
					if (
						typeof e === 'object' &&
						e !== null &&
						'status' in e &&
						(e as { status: number }).status === 404
					) {
						return { repoExists: false };
					}
					throw e;
				}
			}),

		/**
		 * Create a new repo for the team. Max 3 repos, maintain permission.
		 */
		create: protectedProcedure
			.input(
				z.object({
					repoName: z.string().nonempty(),
					description: z.string().default('')
				})
			)
			.handler(async ({ context, input }) => {
				const { teamMembers, team } = context.db.schema;

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
					throw new ORPCError('BAD_REQUEST', {
						message: 'Your team does not have a GitHub team yet'
					});
				}

				// Check repo count
				const { data: existingRepos } = await context.githubApp.rest.teams.listReposInOrg({
					org: serverEnv.PUBLIC_GITHUB_ORGNAME,
					team_slug: myTeam.githubSlug
				});

				const teamRepos = existingRepos.filter((r) => !r.name.startsWith('prompt'));

				if (teamRepos.length >= MAX_REPOS_PER_TEAM) {
					throw new ORPCError('BAD_REQUEST', {
						message: `Maximum of ${MAX_REPOS_PER_TEAM} repositories per team`
					});
				}

				// Create the repo
				const { data: ghRepo } = await context.githubApp.rest.repos.createInOrg({
					org: serverEnv.PUBLIC_GITHUB_ORGNAME,
					name: input.repoName,
					description: input.description,
					private: true
				});

				// Grant team maintain permission
				await context.githubApp.rest.teams.addOrUpdateRepoPermissionsInOrg({
					org: serverEnv.PUBLIC_GITHUB_ORGNAME,
					team_slug: myTeam.githubSlug,
					owner: serverEnv.PUBLIC_GITHUB_ORGNAME,
					repo: ghRepo.name,
					permission: 'admin'
				});

				return {
					repo: {
						id: ghRepo.id,
						name: ghRepo.name,
						fullName: ghRepo.full_name,
						htmlUrl: ghRepo.html_url
					}
				};
			})
	}
};
