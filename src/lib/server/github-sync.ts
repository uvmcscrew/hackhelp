/**
 * GitHub Team Synchronization Service
 *
 * Provides functions for keeping hackhelp teams in sync with GitHub org teams.
 * All functions are fire-and-forget safe — they catch errors and log them
 * rather than propagating, so they never break the primary DB operation.
 */

import { eq, and, sql } from 'drizzle-orm';
import { serverEnv } from '$lib/env/server';
import type { getGithubAppInstallationClient } from '$lib/github';
import db from '$lib/server/db';
import { configurationService } from '$lib/server/config';

type GithubApp = Awaited<ReturnType<typeof getGithubAppInstallationClient>>;
type Team = typeof db.schema.team.$inferSelect;

const org = () => serverEnv.PUBLIC_GITHUB_ORGNAME;

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * Look up a GitHub username from the account table's `accountId` (GitHub numeric user ID).
 * Uses the GitHub App installation client to resolve by ID, which doesn't depend on user token.
 */
async function getGithubUsername(
	githubApp: GithubApp,
	githubAccountId: string
): Promise<string | null> {
	try {
		const { data } = await githubApp.request('GET /user/{account_id}', {
			account_id: parseInt(githubAccountId, 10)
		});
		return (data as { login?: string }).login ?? null;
	} catch (e) {
		console.error(
			`[github-sync] Failed to resolve GitHub username for account ID ${githubAccountId}:`,
			e
		);
		return null;
	}
}

/**
 * Get the GitHub account row for a user (if they have one linked).
 */
async function getGithubAccountForUser(userId: string) {
	const rows = await db.client
		.select({
			accountId: db.schema.account.accountId,
			accessToken: db.schema.account.accessToken
		})
		.from(db.schema.account)
		.where(and(eq(db.schema.account.userId, userId), eq(db.schema.account.providerId, 'github')));
	return rows[0] ?? null;
}

// ─── Core Sync Functions ───────────────────────────────────────────────

/**
 * Ensures a GitHub org team exists for the given hackhelp team.
 * Creates it if missing, verifies and updates githubId/githubSlug if it exists.
 * Returns the updated team row (or null on failure).
 */
export async function ensureGithubTeam(
	githubApp: GithubApp,
	team: Pick<Team, 'id' | 'name' | 'githubId' | 'githubSlug'>
): Promise<{ githubId: number; githubSlug: string } | null> {
	try {
		// If we already have a slug, verify it still exists
		if (team.githubSlug) {
			try {
				const { data } = await githubApp.rest.teams.getByName({
					org: org(),
					team_slug: team.githubSlug
				});
				// Update in case anything changed
				if (data.id !== team.githubId || data.slug !== team.githubSlug) {
					await db.client
						.update(db.schema.team)
						.set({ githubId: data.id, githubSlug: data.slug })
						.where(eq(db.schema.team.id, team.id));
				}
				return { githubId: data.id, githubSlug: data.slug };
			} catch (e: unknown) {
				// 404 means the team was deleted on GitHub — recreate below
				if (isNotFoundError(e)) {
					console.warn(`[github-sync] GitHub team '${team.githubSlug}' not found, recreating...`);
				} else {
					throw e;
				}
			}
		}

		// Create the team on GitHub
		const { data: ghTeam } = await githubApp.rest.teams.create({
			org: org(),
			name: team.name,
			privacy: 'closed'
		});

		// Persist the GitHub team info
		await db.client
			.update(db.schema.team)
			.set({ githubId: ghTeam.id, githubSlug: ghTeam.slug })
			.where(eq(db.schema.team.id, team.id));

		console.log(
			`[github-sync] Created GitHub team '${ghTeam.slug}' (id=${ghTeam.id}) for team '${team.name}'`
		);
		return { githubId: ghTeam.id, githubSlug: ghTeam.slug };
	} catch (e) {
		console.error(`[github-sync] Failed to ensure GitHub team for '${team.name}':`, e);
		return null;
	}
}

/**
 * Deletes the GitHub org team for a hackhelp team.
 * No-op if the team doesn't have a GitHub slug.
 */
export async function deleteGithubTeam(
	githubApp: GithubApp,
	team: Pick<Team, 'id' | 'name' | 'githubSlug'>
): Promise<void> {
	if (!team.githubSlug) return;

	try {
		await githubApp.rest.teams.deleteInOrg({
			org: org(),
			team_slug: team.githubSlug
		});
		console.log(`[github-sync] Deleted GitHub team '${team.githubSlug}'`);
	} catch (e) {
		if (isNotFoundError(e)) {
			console.warn(`[github-sync] GitHub team '${team.githubSlug}' already deleted`);
		} else {
			console.error(`[github-sync] Failed to delete GitHub team '${team.githubSlug}':`, e);
		}
	}
}

/**
 * Adds a user to the GitHub org team, if they have a linked GitHub account
 * and the team has a GitHub slug.
 */
export async function syncTeamMember(
	githubApp: GithubApp,
	team: Pick<Team, 'id' | 'name' | 'githubSlug'>,
	userId: string
): Promise<void> {
	if (!team.githubSlug) return;

	try {
		const ghAccount = await getGithubAccountForUser(userId);
		if (!ghAccount) {
			console.log(`[github-sync] User ${userId} has no GitHub account, skipping team sync`);
			return;
		}

		const username = await getGithubUsername(githubApp, ghAccount.accountId);
		if (!username) {
			console.warn(`[github-sync] Could not resolve GitHub username for user ${userId}`);
			return;
		}

		await githubApp.rest.teams.addOrUpdateMembershipForUserInOrg({
			org: org(),
			team_slug: team.githubSlug,
			username
		});

		console.log(`[github-sync] Added '${username}' to GitHub team '${team.githubSlug}'`);
	} catch (e) {
		console.error(`[github-sync] Failed to sync member ${userId} to team '${team.githubSlug}':`, e);
	}
}

/**
 * Removes a user from the GitHub org team, if they have a linked GitHub account
 * and the team has a GitHub slug.
 */
export async function removeTeamMember(
	githubApp: GithubApp,
	team: Pick<Team, 'id' | 'name' | 'githubSlug'>,
	userId: string
): Promise<void> {
	if (!team.githubSlug) return;

	try {
		const ghAccount = await getGithubAccountForUser(userId);
		if (!ghAccount) return;

		const username = await getGithubUsername(githubApp, ghAccount.accountId);
		if (!username) return;

		await githubApp.rest.teams.removeMembershipForUserInOrg({
			org: org(),
			team_slug: team.githubSlug,
			username
		});

		console.log(`[github-sync] Removed '${username}' from GitHub team '${team.githubSlug}'`);
	} catch (e) {
		if (isNotFoundError(e)) {
			// Already not on the team — fine
			return;
		}
		console.error(
			`[github-sync] Failed to remove member ${userId} from team '${team.githubSlug}':`,
			e
		);
	}
}

/**
 * Removes a GitHub user (by username, not hackhelp userId) from a team.
 * Used during reconciliation when we find stale members.
 */
async function removeGithubUserFromTeam(
	githubApp: GithubApp,
	teamSlug: string,
	username: string
): Promise<void> {
	try {
		await githubApp.rest.teams.removeMembershipForUserInOrg({
			org: org(),
			team_slug: teamSlug,
			username
		});
	} catch (e) {
		if (!isNotFoundError(e)) {
			console.error(`[github-sync] Failed to remove '${username}' from team '${teamSlug}':`, e);
		}
	}
}

// ─── Reconciliation Functions ──────────────────────────────────────────

export type SyncReport = {
	teamsCreated: string[];
	teamsDeleted: string[];
	membersAdded: string[];
	membersRemoved: string[];
	mentorRolesAssigned: string[];
	mentorRolesRemoved: string[];
	errors: string[];
};

/**
 * Full reconciliation for a single team: ensure GitHub team exists,
 * add all members with GitHub accounts, remove any stale GitHub team members.
 */
export async function syncEntireTeam(githubApp: GithubApp, teamId: string): Promise<SyncReport> {
	const report: SyncReport = {
		teamsCreated: [],
		teamsDeleted: [],
		membersAdded: [],
		membersRemoved: [],
		mentorRolesAssigned: [],
		mentorRolesRemoved: [],
		errors: []
	};

	try {
		// Load team
		const [team] = await db.client
			.select()
			.from(db.schema.team)
			.where(eq(db.schema.team.id, teamId));

		if (!team) {
			report.errors.push(`Team ${teamId} not found in DB`);
			return report;
		}

		// Ensure GitHub team
		const ghTeam = await ensureGithubTeam(githubApp, team);
		if (!ghTeam) {
			report.errors.push(`Failed to ensure GitHub team for '${team.name}'`);
			return report;
		}

		if (!team.githubSlug && ghTeam.githubSlug) {
			report.teamsCreated.push(team.name);
		}

		const teamSlug = ghTeam.githubSlug;

		// Load DB members
		const dbMembers = await db.client
			.select({ userId: db.schema.teamMembers.userId })
			.from(db.schema.teamMembers)
			.where(eq(db.schema.teamMembers.teamId, teamId));

		// Build set of GitHub usernames that SHOULD be on the team
		const expectedUsernames = new Set<string>();
		for (const member of dbMembers) {
			const ghAccount = await getGithubAccountForUser(member.userId);
			if (!ghAccount) continue;

			const username = await getGithubUsername(githubApp, ghAccount.accountId);
			if (username) expectedUsernames.add(username.toLowerCase());
		}

		// Get current GitHub team members
		let ghMembers: { login: string }[] = [];
		try {
			const { data } = await githubApp.rest.teams.listMembersInOrg({
				org: org(),
				team_slug: teamSlug
			});
			ghMembers = data;
		} catch (e) {
			report.errors.push(`Failed to list GitHub team members for '${teamSlug}': ${e}`);
			return report;
		}

		const currentGhUsernames = new Set(ghMembers.map((m) => m.login.toLowerCase()));

		// Add missing members
		for (const member of dbMembers) {
			const ghAccount = await getGithubAccountForUser(member.userId);
			if (!ghAccount) continue;

			const username = await getGithubUsername(githubApp, ghAccount.accountId);
			if (!username) continue;

			if (!currentGhUsernames.has(username.toLowerCase())) {
				try {
					await githubApp.rest.teams.addOrUpdateMembershipForUserInOrg({
						org: org(),
						team_slug: teamSlug,
						username
					});
					report.membersAdded.push(`${username} -> ${team.name}`);
				} catch (e) {
					report.errors.push(`Failed to add '${username}' to '${teamSlug}': ${e}`);
				}
			}
		}

		// Remove stale members
		for (const ghMember of ghMembers) {
			if (!expectedUsernames.has(ghMember.login.toLowerCase())) {
				await removeGithubUserFromTeam(githubApp, teamSlug, ghMember.login);
				report.membersRemoved.push(`${ghMember.login} <- ${team.name}`);
			}
		}
	} catch (e) {
		report.errors.push(`Unexpected error syncing team ${teamId}: ${e}`);
	}

	return report;
}

/**
 * Full reconciliation across ALL teams: create missing GitHub teams,
 * sync all memberships, remove stale members.
 */
export async function fullReconciliation(githubApp: GithubApp): Promise<SyncReport> {
	const report: SyncReport = {
		teamsCreated: [],
		teamsDeleted: [],
		membersAdded: [],
		membersRemoved: [],
		mentorRolesAssigned: [],
		mentorRolesRemoved: [],
		errors: []
	};

	try {
		const allTeams = await db.client.select().from(db.schema.team);

		for (const team of allTeams) {
			const teamReport = await syncEntireTeam(githubApp, team.id);
			report.teamsCreated.push(...teamReport.teamsCreated);
			report.teamsDeleted.push(...teamReport.teamsDeleted);
			report.membersAdded.push(...teamReport.membersAdded);
			report.membersRemoved.push(...teamReport.membersRemoved);
			report.errors.push(...teamReport.errors);
		}
	} catch (e) {
		report.errors.push(`Unexpected error during full reconciliation: ${e}`);
	}

	return report;
}

/**
 * For a user who just linked/unlinked their GitHub account, sync their team membership.
 * If they're on a hackhelp team, add/remove them from the corresponding GitHub team.
 */
export async function syncUserTeamAfterAccountChange(
	githubApp: GithubApp,
	userId: string,
	action: 'linked' | 'unlinked'
): Promise<void> {
	try {
		// Find the user's team membership
		const [membership] = await db.client
			.select({
				teamId: db.schema.teamMembers.teamId
			})
			.from(db.schema.teamMembers)
			.where(eq(db.schema.teamMembers.userId, userId));

		if (!membership) return; // Not on a team

		// Load the team
		const [team] = await db.client
			.select()
			.from(db.schema.team)
			.where(eq(db.schema.team.id, membership.teamId));

		if (!team || !team.githubSlug) return;

		if (action === 'linked') {
			await syncTeamMember(githubApp, team, userId);
		} else {
			// For unlink, we need to remove by the GitHub username.
			// But the account row may already be deleted at this point,
			// so we pass the userId and let removeTeamMember handle lookup.
			// If the account is already gone, this will be a no-op.
			await removeTeamMember(githubApp, team, userId);
		}
	} catch (e) {
		console.error(`[github-sync] Failed to sync user ${userId} after account ${action}:`, e);
	}
}

// ─── Mentor Organization Role Sync ─────────────────────────────────────

/**
 * Read the configured mentor org role ID from the configuration table.
 * Returns null if no role has been configured yet.
 */
async function getConfiguredMentorRoleId(): Promise<number | null> {
	return configurationService.getMentorOrgRoleId();
}

/**
 * Assign the configured mentor org role to a user (by hackhelp userId).
 * Requires the user to have a linked GitHub account.
 * No-op if no mentor org role is configured.
 */
export async function assignMentorOrgRole(githubApp: GithubApp, userId: string): Promise<boolean> {
	try {
		const roleId = await getConfiguredMentorRoleId();
		if (!roleId) {
			console.log('[github-sync] No mentor org role configured, skipping assign');
			return false;
		}

		const ghAccount = await getGithubAccountForUser(userId);
		if (!ghAccount) {
			console.log(`[github-sync] User ${userId} has no GitHub account, skipping org role assign`);
			return false;
		}

		const username = await getGithubUsername(githubApp, ghAccount.accountId);
		if (!username) {
			console.warn(`[github-sync] Could not resolve GitHub username for user ${userId}`);
			return false;
		}

		await githubApp.request('PUT /orgs/{org}/organization-roles/users/{username}/{role_id}', {
			org: org(),
			username,
			role_id: roleId
		});

		console.log(`[github-sync] Assigned mentor org role (id=${roleId}) to '${username}'`);
		return true;
	} catch (e) {
		console.error(`[github-sync] Failed to assign org role to user ${userId}:`, e);
		return false;
	}
}

/**
 * Remove the configured mentor org role from a user (by hackhelp userId).
 * No-op if no mentor org role is configured.
 */
export async function removeMentorOrgRole(githubApp: GithubApp, userId: string): Promise<boolean> {
	try {
		const roleId = await getConfiguredMentorRoleId();
		if (!roleId) {
			console.log('[github-sync] No mentor org role configured, skipping remove');
			return false;
		}

		const ghAccount = await getGithubAccountForUser(userId);
		if (!ghAccount) return false;

		const username = await getGithubUsername(githubApp, ghAccount.accountId);
		if (!username) return false;

		await githubApp.request('DELETE /orgs/{org}/organization-roles/users/{username}/{role_id}', {
			org: org(),
			username,
			role_id: roleId
		});

		console.log(`[github-sync] Removed mentor org role (id=${roleId}) from '${username}'`);
		return true;
	} catch (e) {
		if (isNotFoundError(e)) {
			// Already doesn't have the role — fine
			return true;
		}
		console.error(`[github-sync] Failed to remove org role from user ${userId}:`, e);
		return false;
	}
}

/**
 * Full reconciliation of mentor org roles:
 * - Find all hackhelp users with 'mentor' in their role column that have a linked GitHub account
 * - Find all GitHub users currently assigned the org role
 * - Add the role to mentors who are missing it
 * - Remove the role from non-mentors who still have it
 */
export async function reconcileMentorOrgRoles(githubApp: GithubApp): Promise<SyncReport> {
	const report: SyncReport = {
		teamsCreated: [],
		teamsDeleted: [],
		membersAdded: [],
		membersRemoved: [],
		mentorRolesAssigned: [],
		mentorRolesRemoved: [],
		errors: []
	};

	try {
		const roleId = await getConfiguredMentorRoleId();
		if (!roleId) {
			report.errors.push('No mentor org role configured — skip org role reconciliation');
			return report;
		}

		// 1. Get all users with mentor role + GitHub accounts
		const mentorUsers = await db.client
			.select({
				userId: db.schema.user.id,
				userRole: db.schema.user.role,
				accountId: db.schema.account.accountId
			})
			.from(db.schema.user)
			.innerJoin(
				db.schema.account,
				and(
					eq(db.schema.account.userId, db.schema.user.id),
					eq(db.schema.account.providerId, 'github')
				)
			)
			.where(sql`${db.schema.user.role} LIKE '%mentor%'`);

		// Build a map of GitHub username -> userId for expected mentors
		const expectedMentorUsernames = new Map<string, string>(); // lowercase username -> userId
		for (const mu of mentorUsers) {
			const username = await getGithubUsername(githubApp, mu.accountId);
			if (username) {
				expectedMentorUsernames.set(username.toLowerCase(), mu.userId);
			}
		}

		// 2. Get all users currently assigned this org role on GitHub
		let currentRoleUsers: Array<{ login: string }> = [];
		try {
			// Paginate through all users with this role
			let page = 1;
			const perPage = 100;
			while (true) {
				const { data } = await githubApp.request(
					'GET /orgs/{org}/organization-roles/{role_id}/users',
					{
						org: org(),
						role_id: roleId,
						per_page: perPage,
						page
					}
				);
				const users = data as Array<{ login: string }>;
				currentRoleUsers.push(...users);
				if (users.length < perPage) break;
				page++;
			}
		} catch (e) {
			report.errors.push(`Failed to list users with org role: ${e}`);
			return report;
		}

		const currentRoleUsernames = new Set(currentRoleUsers.map((u) => u.login.toLowerCase()));

		// 3. Add role to mentors who are missing it
		for (const [username] of expectedMentorUsernames) {
			if (!currentRoleUsernames.has(username)) {
				try {
					await githubApp.request('PUT /orgs/{org}/organization-roles/users/{username}/{role_id}', {
						org: org(),
						username,
						role_id: roleId
					});
					report.mentorRolesAssigned.push(username);
				} catch (e) {
					report.errors.push(`Failed to assign org role to '${username}': ${e}`);
				}
			}
		}

		// 4. Remove role from non-mentors who still have it
		for (const ghUser of currentRoleUsers) {
			if (!expectedMentorUsernames.has(ghUser.login.toLowerCase())) {
				try {
					await githubApp.request(
						'DELETE /orgs/{org}/organization-roles/users/{username}/{role_id}',
						{
							org: org(),
							username: ghUser.login,
							role_id: roleId
						}
					);
					report.mentorRolesRemoved.push(ghUser.login);
				} catch (e) {
					report.errors.push(`Failed to remove org role from '${ghUser.login}': ${e}`);
				}
			}
		}
	} catch (e) {
		report.errors.push(`Unexpected error during mentor org role reconciliation: ${e}`);
	}

	return report;
}

// ─── Utilities ─────────────────────────────────────────────────────────

function isNotFoundError(e: unknown): boolean {
	return (
		typeof e === 'object' && e !== null && 'status' in e && (e as { status: number }).status === 404
	);
}
