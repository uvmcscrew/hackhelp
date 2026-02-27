import { adminProcedure } from '../shared';
import { eq, sql, count, notInArray, or, ilike, and } from 'drizzle-orm';
import { z } from 'zod';
import { ORPCError } from '@orpc/client';
import { addRole } from '$lib/auth/permissions';
import { profileDataSchema } from '$lib/schemas';
import { serialize } from 'superjson';
import { challengesAdminRouter } from './challenges';
import { TEAM_MAX_SIZE, PROGRAMMERS_MAX, BUSINESS_MAX } from '$lib/config/team-rules';

/**
 * Administrative actions: user management (roles, verification, profile upsert),
 * and team oversight.
 */

// #############################################
// #               USER ROUTER                 #
// #############################################

const userRouter = {
	/**
	 * List all users joined with their profiles.
	 */
	all: adminProcedure.handler(async ({ context }) => {
		const { user, profile, account } = context.db.schema;

		const rows = await context.db.client
			.select({
				user,
				profile,
				hasGithub: sql<boolean>`bool_or(${account.providerId} = 'github')`.as('has_github'),
				hasMlh: sql<boolean>`bool_or(${account.providerId} = 'mlh')`.as('has_mlh')
			})
			.from(user)
			.leftJoin(profile, eq(user.id, profile.id))
			.leftJoin(account, eq(user.id, account.userId))
			.groupBy(user.id, profile.id);

		return { users: rows };
	}),

	/**
	 * Grant the `verifiedUser` role to a user.
	 * Idempotent — safe to call if the role is already present.
	 */
	grantVerified: adminProcedure
		.input(z.object({ userId: z.string().nonempty() }))
		.handler(async ({ context, input }) => {
			const [target] = await context.db.client
				.select()
				.from(context.db.schema.user)
				.where(eq(context.db.schema.user.id, input.userId));

			if (!target) throw new ORPCError('NOT_FOUND', { message: 'User not found' });

			const updatedRoles = addRole(target.role ?? '', 'verifiedUser').join(',');

			await context.db.client
				.update(context.db.schema.user)
				.set({ role: updatedRoles })
				.where(eq(context.db.schema.user.id, input.userId));
		}),
	grantRole: adminProcedure
		.input(z.object({ userId: z.string().nonempty(), role: z.enum(['mentor', 'judge', 'admin']) }))
		.handler(async ({ context, input }) => {
			const [target] = await context.db.client
				.select()
				.from(context.db.schema.user)
				.where(eq(context.db.schema.user.id, input.userId));

			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!target) throw new ORPCError('BAD_REQUEST', { message: 'User not found' });

			// Add both verifiedUser and admin roles
			const updatedRoles = addRole(target.role ?? '', input.role);

			await context.db.client
				.update(context.db.schema.user)
				.set({ role: updatedRoles.join(',') })
				.where(eq(context.db.schema.user.id, input.userId));

			// Upsert the profile with primaryRole = 'mentor'
			const defaultData = serialize(profileDataSchema.parse({ mainlineDietaryRestrictions: {} }));

			await context.db.client
				.insert(context.db.schema.profile)
				.values({ id: input.userId, primaryRole: input.role, data: defaultData })
				.onConflictDoUpdate({
					target: context.db.schema.profile.id,
					set: { primaryRole: input.role }
				});
		}),

	removeRole: adminProcedure
		.input(z.object({ userId: z.string().nonempty(), role: z.enum(['mentor', 'judge', 'admin']) }))
		.handler(async ({ context, input }) => {
			const [target] = await context.db.client
				.select()
				.from(context.db.schema.user)
				.where(eq(context.db.schema.user.id, input.userId));

			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!target) throw new ORPCError('BAD_REQUEST', { message: 'User not found' });

			// Add both verifiedUser and admin roles
			const updatedRoles = removeRole(target.role ?? '', input.role);

			await context.db.client
				.update(context.db.schema.user)
				.set({ role: updatedRoles.join(',') })
				.where(eq(context.db.schema.user.id, input.userId));

			let primaryRole: typeof input.role | null = null;
			if (updatedRoles.includes('admin')) {
				primaryRole = 'admin';
			} else if (updatedRoles.includes('mentor')) {
				primaryRole = 'mentor';
			} else if (updatedRoles.includes('judge')) {
				primaryRole = 'judge';
			}

			await context.db.client
				.update(context.db.schema.profile)
				.set({ primaryRole })
				.where(eq(context.db.schema.profile.id, input.userId));
		})
};

// #############################################
// #               TEAMS ROUTER                #
// #############################################

const teamsAdminRouter = {
	/**
	 * List all teams (including non-public) with member counts.
	 */
	all: adminProcedure.handler(async ({ context }) => {
		const { team, teamMembers, challenge } = context.db.schema;

		const teams = await context.db.client
			.select({
				team,
				memberCount: count(teamMembers.userId).as('member_count'),
				challengeName: challenge.title
			})
			.from(team)
			.leftJoin(teamMembers, eq(team.id, teamMembers.teamId))
			.leftJoin(challenge, eq(team.selectedChallengeId, challenge.id))
			.groupBy(team.id, challenge.title);

		return { teams };
	}),

	/**
	 * Delete a team and all its memberships.
	 */
	deleteTeam: adminProcedure
		.input(z.object({ teamId: z.string().nonempty() }))
		.handler(async ({ context, input }) => {
			const { team, teamMembers } = context.db.schema;

			// Delete memberships first
			await context.db.client.delete(teamMembers).where(eq(teamMembers.teamId, input.teamId));
			// Delete team
			const deleted = await context.db.client
				.delete(team)
				.where(eq(team.id, input.teamId))
				.returning();

			if (deleted.length === 0) throw new ORPCError('NOT_FOUND', { message: 'Team not found' });
		}),

	/**
	 * Toggle whether a team can accept new joins.
	 */
	toggleCanJoin: adminProcedure
		.input(z.object({ teamId: z.string().nonempty(), canJoin: z.boolean() }))
		.handler(async ({ context, input }) => {
			await context.db.client
				.update(context.db.schema.team)
				.set({ canJoin: input.canJoin })
				.where(eq(context.db.schema.team.id, input.teamId));
		}),

	/**
	 * List users who are not currently on any team.
	 * Used for the captain/member selection combobox.
	 */
	usersWithoutTeam: adminProcedure.handler(async ({ context }) => {
		const { user, teamMembers } = context.db.schema;

		const usersOnTeams = context.db.client.select({ userId: teamMembers.userId }).from(teamMembers);

		const results = await context.db.client
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image
			})
			.from(user)
			.where(notInArray(user.id, usersOnTeams));

		return results;
	}),

	/**
	 * Admin-create a team with a named captain.
	 */
	create: adminProcedure
		.input(
			z.object({
				name: z.string().nonempty().min(3).max(50),
				captainUserId: z.string().nonempty(),
				captainRole: z.enum(['business', 'programming'])
			})
		)
		.handler(async ({ context, input }) => {
			const { team, teamMembers } = context.db.schema;

			// Verify captain isn't already on a team
			const existing = await context.db.client
				.select()
				.from(teamMembers)
				.where(eq(teamMembers.userId, input.captainUserId));

			if (existing.length > 0) {
				throw new ORPCError('BAD_REQUEST', { message: 'Selected captain is already on a team' });
			}

			const [newTeam] = await context.db.client
				.insert(team)
				.values({ name: input.name })
				.returning();

			await context.db.client.insert(teamMembers).values({
				teamId: newTeam.id,
				userId: input.captainUserId,
				role: input.captainRole,
				isCaptain: true
			});

			return newTeam;
		}),

	/**
	 * Get a single team with full member details for admin management.
	 */
	getById: adminProcedure
		.input(z.object({ teamId: z.string().nonempty() }))
		.handler(async ({ context, input }) => {
			const { team, teamMembers, user } = context.db.schema;

			const [foundTeam] = await context.db.client
				.select()
				.from(team)
				.where(eq(team.id, input.teamId));

			if (!foundTeam) throw new ORPCError('NOT_FOUND', { message: 'Team not found' });

			const members = await context.db.client
				.select({
					membership: teamMembers,
					user: {
						id: user.id,
						name: user.name,
						email: user.email,
						image: user.image
					}
				})
				.from(teamMembers)
				.where(eq(teamMembers.teamId, input.teamId))
				.leftJoin(user, eq(teamMembers.userId, user.id));

			return {
				...foundTeam,
				members: members.filter((m) => m.user !== null) as Array<{
					membership: (typeof members)[number]['membership'];
					user: NonNullable<(typeof members)[number]['user']>;
				}>
			};
		}),

	/**
	 * Update a team's name.
	 */
	updateName: adminProcedure
		.input(z.object({ teamId: z.string().nonempty(), name: z.string().nonempty().min(3).max(50) }))
		.handler(async ({ context, input }) => {
			const [updated] = await context.db.client
				.update(context.db.schema.team)
				.set({ name: input.name })
				.where(eq(context.db.schema.team.id, input.teamId))
				.returning();

			if (!updated) throw new ORPCError('NOT_FOUND', { message: 'Team not found' });
			return updated;
		}),

	/**
	 * Add a user to a team (admin override — ignores canJoin).
	 */
	addMember: adminProcedure
		.input(
			z.object({
				teamId: z.string().nonempty(),
				userId: z.string().nonempty(),
				role: z.enum(['business', 'programming'])
			})
		)
		.handler(async ({ context, input }) => {
			const { teamMembers } = context.db.schema;

			// Check user isn't already on a team
			const existing = await context.db.client
				.select()
				.from(teamMembers)
				.where(eq(teamMembers.userId, input.userId));

			if (existing.length > 0) {
				throw new ORPCError('BAD_REQUEST', { message: 'User is already on a team' });
			}

			// Check team capacity
			const members = await context.db.client
				.select()
				.from(teamMembers)
				.where(eq(teamMembers.teamId, input.teamId));

			if (members.length >= TEAM_MAX_SIZE) {
				throw new ORPCError('BAD_REQUEST', {
					message: `Team is full (${TEAM_MAX_SIZE}/${TEAM_MAX_SIZE} members)`
				});
			}
			if (
				input.role === 'programming' &&
				members.filter((m) => m.role === 'programming').length >= PROGRAMMERS_MAX
			) {
				throw new ORPCError('BAD_REQUEST', {
					message: `Too many programmers (${PROGRAMMERS_MAX}/${PROGRAMMERS_MAX})`
				});
			}
			if (
				input.role === 'business' &&
				members.filter((m) => m.role === 'business').length >= BUSINESS_MAX
			) {
				throw new ORPCError('BAD_REQUEST', {
					message: `Too many business members (${BUSINESS_MAX}/${BUSINESS_MAX})`
				});
			}

			await context.db.client.insert(teamMembers).values({
				teamId: input.teamId,
				userId: input.userId,
				role: input.role,
				isCaptain: false
			});
		}),

	/**
	 * Remove a member from a team.
	 */
	removeMember: adminProcedure
		.input(z.object({ teamId: z.string().nonempty(), userId: z.string().nonempty() }))
		.handler(async ({ context, input }) => {
			const { teamMembers } = context.db.schema;

			const deleted = await context.db.client
				.delete(teamMembers)
				.where(and(eq(teamMembers.teamId, input.teamId), eq(teamMembers.userId, input.userId)))
				.returning();

			if (deleted.length === 0) {
				throw new ORPCError('NOT_FOUND', { message: 'Member not found on this team' });
			}
		}),

	/**
	 * Update a member's role and/or captain status.
	 * When promoting to captain, demotes the existing captain atomically.
	 */
	updateMember: adminProcedure
		.input(
			z.object({
				teamId: z.string().nonempty(),
				userId: z.string().nonempty(),
				role: z.enum(['business', 'programming']).optional(),
				isCaptain: z.boolean().optional()
			})
		)
		.handler(async ({ context, input }) => {
			const { teamMembers } = context.db.schema;

			const updates: Record<string, unknown> = {};
			if (input.role !== undefined) updates.role = input.role;
			if (input.isCaptain !== undefined) updates.isCaptain = input.isCaptain;

			if (Object.keys(updates).length === 0) return;

			const members = await context.db.client
				.select()
				.from(teamMembers)
				.where(eq(teamMembers.teamId, input.teamId));

			// Check role capacity if changing role
			if (input.role !== undefined) {
				const otherMembers = members.filter((m) => m.userId !== input.userId);
				if (
					input.role === 'programming' &&
					otherMembers.filter((m) => m.role === 'programming').length >= PROGRAMMERS_MAX
				) {
					throw new ORPCError('BAD_REQUEST', {
						message: `Too many programmers (${PROGRAMMERS_MAX}/${PROGRAMMERS_MAX})`
					});
				}
				if (
					input.role === 'business' &&
					otherMembers.filter((m) => m.role === 'business').length >= BUSINESS_MAX
				) {
					throw new ORPCError('BAD_REQUEST', {
						message: `Too many business members (${BUSINESS_MAX}/${BUSINESS_MAX})`
					});
				}
			}

			// If promoting to captain, demote the current captain first
			if (input.isCaptain === true) {
				const currentCaptain = members.find((m) => m.isCaptain && m.userId !== input.userId);
				if (currentCaptain) {
					await context.db.client
						.update(teamMembers)
						.set({ isCaptain: false })
						.where(
							and(
								eq(teamMembers.teamId, input.teamId),
								eq(teamMembers.userId, currentCaptain.userId)
							)
						);
				}
			}

			// If demoting the only captain, prevent it
			if (input.isCaptain === false) {
				const target = members.find((m) => m.userId === input.userId);
				if (target?.isCaptain) {
					const otherCaptains = members.filter((m) => m.isCaptain && m.userId !== input.userId);
					if (otherCaptains.length === 0) {
						throw new ORPCError('BAD_REQUEST', {
							message: 'Cannot demote the only captain. Transfer captaincy first.'
						});
					}
				}
			}

			await context.db.client
				.update(teamMembers)
				.set(updates)
				.where(and(eq(teamMembers.teamId, input.teamId), eq(teamMembers.userId, input.userId)));
		})
};

// #############################################
// #               ADMIN ROUTER                #
// #############################################

export const adminRouter = {
	users: userRouter,
	teams: teamsAdminRouter,
	challenges: challengesAdminRouter
};
