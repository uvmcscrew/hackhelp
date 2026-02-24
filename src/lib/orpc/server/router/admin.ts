import { adminProcedure } from '../shared';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { ORPCError } from '@orpc/client';
import { addRole } from '$lib/auth/permissions';
import { profileDataSchema } from '$lib/schemas';
import { serialize } from 'superjson';

/**
 * Administrative actions: user management (roles, verification, profile upsert).
 */

// #############################################
// #               USER ROUTER                 #
// #############################################

const userRouter = {
	/**
	 * List all users joined with their profiles.
	 */
	all: adminProcedure.handler(async ({ context }) => {
		const rows = await context.db.client
			.select()
			.from(context.db.schema.user)
			.leftJoin(
				context.db.schema.profile,
				eq(context.db.schema.user.id, context.db.schema.profile.id)
			);
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

			if (!target) throw new ORPCError('NOT_FOUND', { message: 'User not found' });

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

			if (!target) throw new ORPCError('NOT_FOUND', { message: 'User not found' });

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
// #               ADMIN ROUTER                #
// #############################################

export const adminRouter = {
	users: userRouter
};
