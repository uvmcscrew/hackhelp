import { adminProcedure, protectedProcedure } from '../shared';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { ORPCError } from '@orpc/client';

/**
 * Public/competitor-facing challenge endpoints.
 * Challenges are only visible after the configured challengesViewAvailableFrom time
 * (or if challengesViewAvailableNow is true).
 */
export const challengesRouter = {
	/**
	 * Check whether challenges are visible yet.
	 * Lightweight query intended for frequent polling before reveal.
	 */
	availability: protectedProcedure.handler(async ({ context }) => {
		const config = await context.config.getChallengeConfig();
		const now = new Date();
		const visible = config.challengesViewAvailableNow || now >= config.challengesViewAvailableFrom;

		return {
			visible,
			availableFrom: config.challengesViewAvailableFrom
		};
	}),

	/**
	 * List all challenges with team counts and registration status.
	 * Only returns data once challenges are visible.
	 * Intended to be polled every 1-2s once enabled, so also returns canRegister.
	 */
	list: protectedProcedure.handler(async ({ context }) => {
		const config = await context.config.getChallengeConfig();
		const now = new Date();

		const visible = config.challengesViewAvailableNow || now >= config.challengesViewAvailableFrom;

		if (!visible) {
			return {
				challenges: [],
				maxTeamsPerChallenge: config.maxTeamsPerChallenge,
				canRegister: false
			};
		}

		const { challenge, team } = context.db.schema;

		// Get challenges with team count via a left join + group by
		const challenges = await context.db.client
			.select({
				id: challenge.id,
				title: challenge.title,
				description: challenge.description,
				linkedRepo: challenge.linkedRepo,
				teamCount: sql<number>`count(${team.id})::int`
			})
			.from(challenge)
			.leftJoin(team, eq(team.selectedChallengeId, challenge.id))
			.groupBy(challenge.id);

		const canRegister =
			config.challengesRegisterAvailableNow || now >= config.challengesRegisterAvailableFrom;

		return {
			challenges,
			maxTeamsPerChallenge: config.maxTeamsPerChallenge,
			canRegister
		};
	}),

	/**
	 * Select a challenge for the caller's team. Captain-only.
	 */
	selectForTeam: protectedProcedure
		.input(z.object({ challengeId: z.string() }))
		.handler(async ({ context, input }) => {
			const { teamMembers, team, challenge } = context.db.schema;

			// Verify caller is a captain
			const [membership] = await context.db.client
				.select()
				.from(teamMembers)
				.where(eq(teamMembers.userId, context.user.id));

			if (!membership || !membership.isCaptain) {
				throw new ORPCError('FORBIDDEN', {
					message: 'Only the team captain can select a challenge'
				});
			}

			// Verify challenge exists
			const [ch] = await context.db.client
				.select()
				.from(challenge)
				.where(eq(challenge.id, input.challengeId));

			if (!ch) throw new ORPCError('NOT_FOUND', { message: 'Challenge not found' });

			// Check registration is open
			const config = await context.config.getChallengeConfig();
			const now = new Date();
			const canRegister =
				config.challengesRegisterAvailableNow || now >= config.challengesRegisterAvailableFrom;

			if (!canRegister) {
				throw new ORPCError('BAD_REQUEST', { message: 'Challenge registration is not yet open' });
			}

			// Check maxTeamsPerChallenge limit
			const [countResult] = await context.db.client
				.select({ count: sql<number>`count(*)::int` })
				.from(team)
				.where(eq(team.selectedChallengeId, input.challengeId));

			if (countResult.count >= config.maxTeamsPerChallenge) {
				throw new ORPCError('BAD_REQUEST', {
					message: `This challenge has reached the maximum number of teams (${config.maxTeamsPerChallenge})`
				});
			}

			// Update the team's selected challenge
			await context.db.client
				.update(team)
				.set({ selectedChallengeId: input.challengeId })
				.where(eq(team.id, membership.teamId));

			return { success: true };
		})
};

/**
 * Admin challenge management endpoints.
 */
export const challengesAdminRouter = {
	/**
	 * List all challenges (no visibility restrictions).
	 */
	list: adminProcedure.handler(async ({ context }) => {
		const { challenge, team } = context.db.schema;

		const challenges = await context.db.client
			.select({
				id: challenge.id,
				title: challenge.title,
				description: challenge.description,
				linkedRepo: challenge.linkedRepo,
				teamCount: sql<number>`count(${team.id})::int`
			})
			.from(challenge)
			.leftJoin(team, eq(team.selectedChallengeId, challenge.id))
			.groupBy(challenge.id);

		return challenges;
	}),

	/**
	 * Create a new challenge.
	 */
	create: adminProcedure
		.input(
			z.object({
				title: z.string().min(1).max(200),
				description: z.string().max(5000).optional(),
				linkedRepo: z.string().optional()
			})
		)
		.handler(async ({ context, input }) => {
			const [created] = await context.db.client
				.insert(context.db.schema.challenge)
				.values({
					title: input.title,
					description: input.description ?? null,
					linkedRepo: input.linkedRepo ?? null
				})
				.returning();

			return created;
		}),

	/**
	 * Update an existing challenge.
	 */
	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(1).max(200).optional(),
				description: z.string().max(5000).optional(),
				linkedRepo: z.string().nullable().optional()
			})
		)
		.handler(async ({ context, input }) => {
			const updates: Record<string, unknown> = {};
			if (input.title !== undefined) updates.title = input.title;
			if (input.description !== undefined) updates.description = input.description;
			if (input.linkedRepo !== undefined) updates.linkedRepo = input.linkedRepo;

			if (Object.keys(updates).length === 0) return;

			const [updated] = await context.db.client
				.update(context.db.schema.challenge)
				.set(updates)
				.where(eq(context.db.schema.challenge.id, input.id))
				.returning();

			if (!updated) throw new ORPCError('NOT_FOUND', { message: 'Challenge not found' });
			return updated;
		}),

	/**
	 * Delete a challenge.
	 */
	delete: adminProcedure.input(z.object({ id: z.string() })).handler(async ({ context, input }) => {
		// Clear selectedChallengeId on any teams that had this challenge
		await context.db.client
			.update(context.db.schema.team)
			.set({ selectedChallengeId: null })
			.where(eq(context.db.schema.team.selectedChallengeId, input.id));

		const deleted = await context.db.client
			.delete(context.db.schema.challenge)
			.where(eq(context.db.schema.challenge.id, input.id))
			.returning();

		if (deleted.length === 0) throw new ORPCError('NOT_FOUND', { message: 'Challenge not found' });
	}),

	/**
	 * List repos in the GitHub organization for the linked repo dropdown.
	 */
	githubOrgRepos: adminProcedure.handler(async ({ context }) => {
		const repos = await context.githubApp.request('GET /installation/repositories', {
			per_page: 100
		});

		return repos.data.repositories.map((r) => ({
			fullName: r.full_name,
			name: r.name,
			htmlUrl: r.html_url
		}));
	})
};
