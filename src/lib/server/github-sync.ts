/**
 * GitHub Team Synchronization Service
 *
 * Provides functions for keeping hackhelp teams in sync with GitHub org teams.
 * All functions are fire-and-forget safe — they catch errors and log them
 * rather than propagating, so they never break the primary DB operation.
 */

import { eq, and } from 'drizzle-orm';
import { serverEnv } from '$lib/env/server';
import type { getGithubAppInstallationClient } from '$lib/github';
import db from '$lib/server/db';

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

// ─── Utilities ─────────────────────────────────────────────────────────

function isNotFoundError(e: unknown): boolean {
	return (
		typeof e === 'object' && e !== null && 'status' in e && (e as { status: number }).status === 404
	);
}
