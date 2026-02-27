import { adminProcedure } from '../shared';
import { eq, sql, count, notInArray, and } from 'drizzle-orm';
import { z } from 'zod';
import { ORPCError } from '@orpc/client';
import { addRole, removeRole } from '$lib/auth/permissions';
import { profileDataSchema } from '$lib/schemas';
import { serialize } from 'superjson';
import { challengesAdminRouter } from './challenges';
import { TEAM_MAX_SIZE, PROGRAMMERS_MAX, BUSINESS_MAX } from '$lib/config/team-rules';
import { createId as cuid2 } from '@paralleldrive/cuid2';
import { Octokit } from 'octokit';
import { auth, type MLHUserProfile } from '$lib/auth/server.server';

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
		}),

	/**
	 * Import users from CSV data.
	 * Each row must have a `name` and `email`. All imported users are created
	 * as competitors with an initialized profile. Rows whose email already
	 * exists in the database are skipped.
	 */
	importUsers: adminProcedure
		.input(
			z.object({
				users: z.array(
					z.object({
						name: z.string().nonempty(),
						email: z.email()
					})
				)
			})
		)
		.handler(async ({ context, input }) => {
			const { user, profile } = context.db.schema;

			// Fetch all existing emails so we can skip duplicates
			const existingUsers = await context.db.client.select({ email: user.email }).from(user);
			const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

			const defaultProfileData = serialize(
				profileDataSchema.parse({ mainlineDietaryRestrictions: {} })
			);

			let created = 0;
			let skipped = 0;

			for (const row of input.users) {
				if (existingEmails.has(row.email.toLowerCase())) {
					skipped++;
					continue;
				}

				const id = cuid2();

				await context.db.client.insert(user).values({
					id,
					name: row.name,
					email: row.email,
					emailVerified: false,
					role: 'verifiedUser'
				});

				await context.db.client.insert(profile).values({
					id,
					primaryRole: 'competitor',
					data: defaultProfileData
				});

				existingEmails.add(row.email.toLowerCase());
				created++;
			}

			return { created, skipped, total: input.users.length };
		}),

	/**
	 * Get a single user with their profile, linked accounts, and team membership.
	 * For OAuth providers with stored access tokens, fetches the user's profile
	 * from the provider API (GitHub, MLH).
	 */
	getById: adminProcedure
		.input(z.object({ userId: z.string().nonempty() }))
		.handler(async ({ context, input }) => {
			const { user, profile, account, teamMembers, team } = context.db.schema;

			// Fetch user
			const [foundUser] = await context.db.client
				.select()
				.from(user)
				.where(eq(user.id, input.userId));

			if (!foundUser) throw new ORPCError('NOT_FOUND', { message: 'User not found' });

			// Fetch profile
			const [userProfile] = await context.db.client
				.select()
				.from(profile)
				.where(eq(profile.id, input.userId));

			// Fetch linked accounts (include accessToken for provider API calls)
			const accounts = await context.db.client
				.select({
					id: account.id,
					providerId: account.providerId,
					accountId: account.accountId,
					accessToken: account.accessToken,
					createdAt: account.createdAt
				})
				.from(account)
				.where(eq(account.userId, input.userId));

			// Fetch rich profile data from providers using their access tokens
			type ProviderProfile =
				| {
						providerId: 'github';
						login: string;
						avatarUrl: string;
						profileUrl: string;
						name: string | null;
						bio: string | null;
				  }
				| {
						providerId: 'mlh';
						firstName: string;
						lastName: string;
						email: string | null;
						countryOfResidence: string | null;
						gender: string | null;
						age: number | null;
						education: Array<{
							current: boolean;
							schoolName: string;
							major: string | null;
						}> | null;
				  }
				| { providerId: 'uvm-netid' }
				| { providerId: 'email' }
				| { providerId: string; error: string };

			const providerProfiles: ProviderProfile[] = await Promise.all(
				accounts.map(async (acct): Promise<ProviderProfile> => {
					try {
						if (acct.providerId === 'github' && acct.accessToken) {
							const gh = new Octokit({ auth: acct.accessToken });
							const { data } = await gh.rest.users.getAuthenticated();
							return {
								providerId: 'github',
								login: data.login,
								avatarUrl: data.avatar_url,
								profileUrl: data.html_url,
								name: data.name ?? null,
								bio: data.bio ?? null
							};
						}

						if (acct.providerId === 'mlh' && acct.accessToken) {
							const tokenResult = await auth.api.getAccessToken({
								body: { providerId: 'mlh', accountId: acct.id },
								headers: context.req.headers
							});
							const res = await fetch('https://api.mlh.com/v4/users/me?expand[]=education', {
								headers: { Authorization: `Bearer ${tokenResult.accessToken}` }
							});
							if (!res.ok) {
								return {
									providerId: 'mlh',
									error: `MLH API returned ${res.status}`
								} as ProviderProfile;
							}
							const mlh = (await res.json()) as MLHUserProfile;
							return {
								providerId: 'mlh',
								firstName: mlh.first_name,
								lastName: mlh.last_name,
								email: mlh.email ?? null,
								countryOfResidence: mlh.profile?.country_of_residence ?? null,
								gender: mlh.profile?.gender ?? null,
								age: mlh.profile?.age ?? null,
								education:
									mlh.education?.map((e) => ({
										current: e.current,
										schoolName: e.school_name,
										major: e.major ?? null
									})) ?? null
							};
						}

						if (acct.providerId === 'uvm-netid') {
							return { providerId: 'uvm-netid' };
						}

						if (acct.providerId === 'email') {
							return { providerId: 'email' };
						}

						return { providerId: acct.providerId, error: 'Unknown provider' };
					} catch (e) {
						return {
							providerId: acct.providerId,
							error: e instanceof Error ? e.message : 'Failed to fetch profile'
						};
					}
				})
			);

			// Fetch team membership (if any)
			const [membership] = await context.db.client
				.select({
					membership: teamMembers,
					team: {
						id: team.id,
						name: team.name
					}
				})
				.from(teamMembers)
				.where(eq(teamMembers.userId, input.userId))
				.leftJoin(team, eq(teamMembers.teamId, team.id));

			return {
				user: foundUser,
				profile: userProfile ?? null,
				accounts: providerProfiles,
				team: membership?.team
					? {
							...membership.team,
							role: membership.membership.role,
							isCaptain: membership.membership.isCaptain
						}
					: null
			};
		}),

	/**
	 * Delete a user and all associated data.
	 * The user table has CASCADE deletes on sessions, accounts, passkeys,
	 * and profiles. Team memberships reference user.id without CASCADE,
	 * so we remove those explicitly first.
	 */
	deleteUser: adminProcedure
		.input(z.object({ userId: z.string().nonempty() }))
		.handler(async ({ context, input }) => {
			const { user, teamMembers } = context.db.schema;

			// Remove team memberships first (no cascade on this FK)
			await context.db.client.delete(teamMembers).where(eq(teamMembers.userId, input.userId));

			// Delete the user — cascades to session, account, passkey, profile
			const deleted = await context.db.client
				.delete(user)
				.where(eq(user.id, input.userId))
				.returning();

			if (deleted.length === 0) {
				throw new ORPCError('NOT_FOUND', { message: 'User not found' });
			}
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
