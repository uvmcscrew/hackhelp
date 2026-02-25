import { adminProcedure } from '../shared';
import { eq, sql, count } from 'drizzle-orm';
import { z } from 'zod';
import { ORPCError } from '@orpc/client';
import { addRole } from '$lib/auth/permissions';
import { profileDataSchema } from '$lib/schemas';
import { serialize } from 'superjson';

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

	/**
	 * Grant the `judge` role and set primaryRole on the profile.
	 * Creates the profile (with defaults) if it does not yet exist.
	 * Also implicitly grants `verifiedUser` so the profile system is unlocked.
	 */
	grantJudge: adminProcedure
		.input(z.object({ userId: z.string().nonempty() }))
		.handler(async ({ context, input }) => {
			const [target] = await context.db.client
				.select()
				.from(context.db.schema.user)
				.where(eq(context.db.schema.user.id, input.userId));

			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!target) throw new ORPCError('BAD_REQUEST', { message: 'User not found' });

			// Add both verifiedUser and judge roles
			let updatedRoles = addRole(target.role ?? '', 'verifiedUser');
			updatedRoles = addRole(updatedRoles.join(','), 'judge');

			await context.db.client
				.update(context.db.schema.user)
				.set({ role: updatedRoles.join(',') })
				.where(eq(context.db.schema.user.id, input.userId));

			// Upsert the profile with primaryRole = 'judge'
			const defaultData = serialize(profileDataSchema.parse({ mainlineDietaryRestrictions: {} }));

			await context.db.client
				.insert(context.db.schema.profile)
				.values({ id: input.userId, primaryRole: 'judge', data: defaultData })
				.onConflictDoUpdate({
					target: context.db.schema.profile.id,
					set: { primaryRole: 'judge' }
				});
		}),

	/**
	 * Grant the `mentor` role and set primaryRole on the profile.
	 * Creates the profile (with defaults) if it does not yet exist.
	 * Also implicitly grants `verifiedUser` so the profile system is unlocked.
	 */
	grantMentor: adminProcedure
		.input(z.object({ userId: z.string().nonempty() }))
		.handler(async ({ context, input }) => {
			const [target] = await context.db.client
				.select()
				.from(context.db.schema.user)
				.where(eq(context.db.schema.user.id, input.userId));

			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!target) throw new ORPCError('BAD_REQUEST', { message: 'User not found' });

			// Add both verifiedUser and mentor roles
			let updatedRoles = addRole(target.role ?? '', 'verifiedUser');
			updatedRoles = addRole(updatedRoles.join(','), 'mentor');

			await context.db.client
				.update(context.db.schema.user)
				.set({ role: updatedRoles.join(',') })
				.where(eq(context.db.schema.user.id, input.userId));

			// Upsert the profile with primaryRole = 'mentor'
			const defaultData = serialize(profileDataSchema.parse({ mainlineDietaryRestrictions: {} }));

			await context.db.client
				.insert(context.db.schema.profile)
				.values({ id: input.userId, primaryRole: 'mentor', data: defaultData })
				.onConflictDoUpdate({
					target: context.db.schema.profile.id,
					set: { primaryRole: 'mentor' }
				});
		}),
	grantAdmin: adminProcedure
		.input(z.object({ userId: z.string().nonempty() }))
		.handler(async ({ context, input }) => {
			const [target] = await context.db.client
				.select()
				.from(context.db.schema.user)
				.where(eq(context.db.schema.user.id, input.userId));

			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!target) throw new ORPCError('BAD_REQUEST', { message: 'User not found' });

			// Add both verifiedUser and mentor roles
			let updatedRoles = addRole(target.role ?? '', 'verifiedUser');
			updatedRoles = addRole(updatedRoles.join(','), 'mentor');

			await context.db.client
				.update(context.db.schema.user)
				.set({ role: updatedRoles.join(',') })
				.where(eq(context.db.schema.user.id, input.userId));

			// Upsert the profile with primaryRole = 'mentor'
			const defaultData = serialize(profileDataSchema.parse({ mainlineDietaryRestrictions: {} }));

			await context.db.client
				.insert(context.db.schema.profile)
				.values({ id: input.userId, primaryRole: 'mentor', data: defaultData })
				.onConflictDoUpdate({
					target: context.db.schema.profile.id,
					set: { primaryRole: 'mentor' }
				});
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
		})
};

// #############################################
// #               ADMIN ROUTER                #
// #############################################

export const adminRouter = {
	users: userRouter,
	teams: teamsAdminRouter
};
