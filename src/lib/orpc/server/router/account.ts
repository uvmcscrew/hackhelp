import { o, protectedProcedure } from '../shared';
import { and, eq } from 'drizzle-orm';
import { serverEnv } from '$lib/env/server';
import type { AuthedContext } from '../context';
import { octokit } from '$lib/github';
import { ORPCError, type } from '@orpc/server';
import { addRole, checkRolePermission } from '$lib/auth/permissions';

// #############################################
// #              ACCOUNT ROUTER               #
// #############################################

async function hasPendingInvite(ctx: AuthedContext, githubUsername: string) {
	const invites = await ctx.githubApp.rest.orgs.listPendingInvitations({
		org: serverEnv.PUBLIC_GITHUB_ORGNAME
	});

	// If the username is present in the list of pending invites, return true
	return invites.data.some((invite) => invite.login === githubUsername);
}

async function getProviderAccounts(context: AuthedContext, providerId: string) {
	return await context.db.client
		.select()
		.from(context.db.schema.account)
		.where(
			and(
				eq(context.db.schema.account.userId, context.user.id),
				eq(context.db.schema.account.providerId, providerId)
			)
		);
}

async function getGithubUserInformation(context: AuthedContext) {
	const accounts = await getProviderAccounts(context, 'github');

	if (accounts.length === 0)
		throw new ORPCError('BAD_REQUEST', {
			message: 'You must have a linked GitHub account to make this request'
		});

	const githubAccount = accounts[0];

	try {
		const [user, orgs] = (
			await Promise.all([
				octokit.rest.users.getAuthenticated({
					headers: {
						Authorization: `Bearer ${githubAccount.accessToken}`
					}
				}),
				octokit.rest.orgs.listForAuthenticatedUser({
					headers: {
						Authorization: `Bearer ${githubAccount.accessToken}`
					}
				})
			])
		).map((p) => p.data);
		return { user, orgs, providerAccount: githubAccount } as {
			user: Awaited<ReturnType<typeof octokit.rest.users.getAuthenticated>>['data'];
			orgs: Awaited<ReturnType<typeof octokit.rest.orgs.listForAuthenticatedUser>>['data'];
			providerAccount: typeof githubAccount;
		};
	} catch (err) {
		console.error(err);
		throw new ORPCError('BAD_REQUEST', { message: 'Cannot authenticate to GitHub' });
	}
}

type GetGithubProfile =
	| { hasGithubProfile: false; message: string; orgStatus?: never; profile?: never }
	| {
			hasGithubProfile: true;
			message?: never;
			orgStatus: 'joined' | 'invited' | 'unknown';
			profile: { username: string; fullName: string | null; avatar: string };
	  };

export const accountRouter = {
	canCreateProfile: protectedProcedure.route({ method: 'GET' }).handler(({ context }) => {
		return checkRolePermission({
			roles: context.user.role || '',
			permissions: { profile: ['create', 'update'] }
		});
	}),

	canRequestVerification: protectedProcedure
		.route({ method: 'GET' })
		.handler(async ({ context }) => {
			// For now, only people with a linked UVM NetID can request verification
			const accounts = await context.db.client
				.select()
				.from(context.db.schema.account)
				.where(eq(context.db.schema.account.userId, context.user.id));

			for (const acc of accounts) {
				if (acc.providerId === 'uvm-netid') return true;
			}

			return false;
		}),

	requestVerification: protectedProcedure.handler(async ({ context }) => {
		const accounts = await context.db.client
			.select()
			.from(context.db.schema.account)
			.where(eq(context.db.schema.account.userId, context.user.id));

		for (const acc of accounts) {
			if (acc.providerId === 'uvm-netid') {
				await context.db.client
					.update(context.db.schema.user)
					.set({ role: addRole(context.user.role || '', 'verifiedUser').join(',') })
					.where(eq(context.db.schema.user.id, context.user.id));

				return true;
			}
		}
		return false;
	}),

	hasUvmProfile: protectedProcedure.handler(async ({ context }) => {
		const accounts = await getProviderAccounts(context, 'uvm-netid');

		if (accounts.length === 0) return false;

		return true;
	}),

	getGitHubProfile: protectedProcedure
		.output(type<GetGithubProfile>((value) => value))
		.handler(async ({ context }) => {
			const { user, orgs } = await getGithubUserInformation(context);

			const orgStatus = orgs.some((org) => org.login === serverEnv.PUBLIC_GITHUB_ORGNAME)
				? 'joined'
				: (await hasPendingInvite(context, user.login))
					? 'invited'
					: 'unknown';

			return {
				hasGithubProfile: true,
				orgStatus,
				profile: { username: user.login, fullName: user.name, avatar: user.avatar_url }
			} satisfies GetGithubProfile;
		}),

	addGitHubUserToOrg: protectedProcedure.handler(async ({ context }) => {
		const { user, orgs, providerAccount: githubAccount } = await getGithubUserInformation(context);

		if (orgs.some((org) => org.login === serverEnv.PUBLIC_GITHUB_ORGNAME))
			throw new ORPCError('UNAUTHORIZED', {
				message: 'You are already a member of the organization'
			});

		// If the user does not have an existing invite to the org, create one
		if (!(await hasPendingInvite(context, user.login))) {
			await context.githubApp.rest.orgs.createInvitation({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				invitee_id: user.id,
				role: 'direct_member'
			});
		}

		// Accept the pending invite
		try {
			const inviteResult = (
				await octokit.rest.orgs.updateMembershipForAuthenticatedUser({
					headers: {
						Authorization: `Bearer ${githubAccount.accessToken}`
					},
					org: serverEnv.PUBLIC_GITHUB_ORGNAME,
					state: 'active'
				})
			).data;

			return inviteResult.state === 'active';
		} catch (err) {
			console.error(err);
			throw new ORPCError('SERVER_ERROR', { message: 'Could not accept invite' });
		}
	}),

	unlinkGitHubAccount: protectedProcedure.handler(async ({ context }) => {
		const { user, orgs, providerAccount } = await getGithubUserInformation(context);

		const orgStatus = orgs.some((org) => org.login === serverEnv.PUBLIC_GITHUB_ORGNAME)
			? 'joined'
			: (await hasPendingInvite(context, user.login))
				? 'invited'
				: 'unknown';

		if (orgStatus === 'joined') {
			// If the user is in the organization, remove them if they're not an owner
			const userIsAdmin =
				(
					await context.githubApp.rest.orgs.getMembershipForUser({
						org: serverEnv.PUBLIC_GITHUB_ORGNAME,
						username: user.login
					})
				).data.role === 'admin';

			if (!userIsAdmin) {
				await context.githubApp.rest.orgs.removeMember({
					org: serverEnv.PUBLIC_GITHUB_ORGNAME,
					username: user.login
				});
			}
		} else if (orgStatus === 'invited') {
			// Cancel pending invitations
			const invite = (
				await context.githubApp.rest.orgs.listPendingInvitations({
					org: serverEnv.PUBLIC_GITHUB_ORGNAME
				})
			).data.filter((i) => i.login === user.login)[0];

			await context.githubApp.rest.orgs.cancelInvitation({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME,
				invitation_id: invite.id
			});
		}

		// Delete the provider account in the database
		await context.db.client
			.delete(context.db.schema.account)
			.where(eq(context.db.schema.account.id, providerAccount.id));
	}),

	setProfilePhotoToGithub: protectedProcedure.handler(async ({ context }) => {
		const { user } = await getGithubUserInformation(context);

		await context.db.client
			.update(context.db.schema.user)
			.set({ image: user.avatar_url })
			.where(eq(context.db.schema.user.id, context.user.id));

		return {
			avatarUrl: user.avatar_url
		};
	})
};

// #############################################
// #         AUTHENTICATION ROUTER             #
// #############################################

export const authRouter = {
	getOAuthUrlMutation: o.route({ method: 'POST' }).handler(({ context: _ }) => {
		return false;
	})
};
