import { checkRolePermission } from '$lib/auth/permissions';
import type { TeamMembership } from '$lib/server/db/schema';
import { publicProcedure, protectedProcedure } from '../shared';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { ORPCError } from '@orpc/client';

export const teamsRouter = {
	listAll: publicProcedure.handler(async ({ context }) => {
		const canViewExtendedInfo = checkRolePermission({
			roles: context.user?.role || '',
			permissions: { team: ['viewPublic'] }
		});

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

	byId: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const teams = await context.db.client
				.select()
				.from(context.db.schema.team)
				.where(eq(context.db.schema.team.id, input.id));

			if (teams.length === 0)
				throw new ORPCError('BAD_REQUEST', { message: 'Team does not exist' });

			const team = teams[0];

			const members = await context.db.client
				.select()
				.from(context.db.schema.teamMembers)
				.where(eq(context.db.schema.teamMembers.teamId, team.id))
				.leftJoin(
					context.db.schema.user,
					eq(context.db.schema.teamMembers.userId, context.db.schema.user.id)
				);

			return { ...team, members };
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

			if (members.length >= 7) {
				joinAllowed = false;
				joinDenyReason = 'Too many people';
			} else if (members.filter((m) => m.role === 'programming').length >= 5) {
				joinAllowed = false;
				joinDenyReason = 'Too many programmers';
			} else if (members.filter((m) => m.role === 'business').length >= 2) {
				joinAllowed = false;
				joinDenyReason = 'Too many businesspeople';
			}

			if (!joinAllowed) throw new ORPCError('BAD_REQUEST', { message: joinDenyReason });

			// Create membership
			await context.db.client
				.insert(context.db.schema.teamMembers)
				.values({ teamId: team.id, userId: context.user.id, role: input.asRole });
		})
};
