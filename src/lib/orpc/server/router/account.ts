import { o, protectedProcedure } from '../shared';
import { and, eq } from 'drizzle-orm';
import { serverEnv } from '$lib/env/server';
import type { AuthedContext } from '../context';
import { octokit } from '$lib/github';
import { RequestError as OctokitRequestError } from 'octokit';
import { ORPCError, type } from '@orpc/server';
import { addRole, checkRolePermission } from '$lib/auth/permissions';
import { dev } from '$app/environment';
import { formatDistance, isPast } from 'date-fns';

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

type GithubUserInformation = (
	| {
			user: Awaited<ReturnType<typeof octokit.rest.users.getAuthenticated>>['data'];
			orgs: Awaited<ReturnType<typeof octokit.rest.orgs.listForAuthenticatedUser>>['data'];
			err?: never;
			errType?: never;
	  }
	| {
			user?: never;
			orgs?: never;
			err: ORPCError<'INTERNAL_SERVER_ERROR' | 'BAD_REQUEST', unknown>;
			errType: string;
	  }
) & {
	providerAccount: Awaited<ReturnType<typeof getProviderAccounts>>[0];
};

type GitHubAccessTokenRefreshResponse = {
	access_token: string;
	expires_in: number;
	// Remaining parameters omitted bc they don't matter for us
};

async function getGithubUserInformation(context: AuthedContext): Promise<GithubUserInformation> {
	const accounts = await getProviderAccounts(context, 'github');

	if (accounts.length === 0)
		throw new ORPCError('BAD_REQUEST', {
			message: 'You must have a linked GitHub account to make this request'
		});

	const githubAccount = accounts[0];

	// Check access token expiry, and refresh if necessary
	if (
		githubAccount.accessTokenExpiresAt &&
		new Date(githubAccount.accessTokenExpiresAt) < new Date()
	) {
		const refreshURL = new URL('https://github.com/login/oauth/access_token');
		refreshURL.searchParams.set('client_id', serverEnv.GITHUB_APP_CLIENT_ID);
		refreshURL.searchParams.set('client_secret', serverEnv.GITHUB_APP_CLIENT_SECRET);
		refreshURL.searchParams.set('grant_type', 'refresh_token');
		refreshURL.searchParams.set('refresh_token', githubAccount.refreshToken || '');

		const refreshResponse = await fetch(refreshURL, {
			method: 'POST'
		});

		console.log(
			'Refreshing Github Access Token',
			refreshURL.toString(),
			'Status: ',
			refreshResponse.status,
			refreshResponse.statusText
		);

		const refreshResBody = new URLSearchParams(await refreshResponse.text());

		console.log('Refresh Response Body', refreshResBody);

		if (!refreshResponse.ok || refreshResBody.get('error')) {
			return {
				err: new ORPCError('INTERNAL_SERVER_ERROR', {
					message: `Failed to refresh GitHub access token: ${refreshResBody.get('error_description')}`
				}),
				errType: !refreshResponse.ok
					? refreshResponse.statusText
					: (refreshResBody.get('error') ?? ''),
				providerAccount: githubAccount
			};
		}

		const accessToken = refreshResBody.get('access_token');
		if (!accessToken) {
			return {
				err: new ORPCError('INTERNAL_SERVER_ERROR', {
					message: `Failed to refresh GitHub access token. Token not found in response`
				}),
				errType: 'Unknown',
				providerAccount: githubAccount
			};
		}
		const expirySeconds = parseInt(refreshResBody.get('expires_in') || '0');

		// Update the account in the database
		const newExpiry = new Date();
		newExpiry.setSeconds(newExpiry.getSeconds() + expirySeconds);
		await context.db.client
			.update(context.db.schema.account)
			.set({
				accessToken: accessToken,
				accessTokenExpiresAt: newExpiry
			})
			.where(eq(context.db.schema.account.id, githubAccount.id));

		// Update the local variable to use the new access token
		githubAccount.accessToken = accessToken;

		console.log('Github Access Token Refresh Complete');
	}

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
		if (err instanceof OctokitRequestError) {
			// @ts-expect-error I'm not writing a type for this
			const githubErrMessage = (err.response?.data.message as string) || 'Unknown GitHub Error';
			console.error('GitHub Request Error', err);
			const oErr = new ORPCError('BAD_REQUEST', {
				message: `Cannot authenticate to GitHub: ${githubErrMessage}`
			});

			return { err: oErr, errType: githubErrMessage, providerAccount: githubAccount };
		} else {
			throw new ORPCError('INTERNAL_SERVER_ERROR', {
				message: 'Failed while fetching data from GitHub'
			});
		}
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

	shouldShowNavigationButtons: protectedProcedure
		.route({ method: 'GET' })
		.handler(async ({ context }) => {
			// Always show navigation buttons in dev environment
			if (dev) return true;

			// Always show navigation buttons for administrators
			if (context.user.role?.split(',').includes('admin')) return true;

			// Otherwise, check to see if the event has started yet
			const eventStartTime = await context.config.getEventStartTime();

			return new Date() >= eventStartTime;
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
			const { user, orgs, err } = await getGithubUserInformation(context);

			if (err) {
				throw err;
			}

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

	checkGithubTokens: protectedProcedure.handler(async ({ context }) => {
		const accounts = await getProviderAccounts(context, 'github');

		if (accounts.length === 0)
			throw new ORPCError('BAD_REQUEST', {
				message: 'You must have a linked GitHub account to make this request'
			});

		const githubAccount = accounts[0];

		if (!githubAccount.accessTokenExpiresAt || !githubAccount.refreshTokenExpiresAt) {
			throw new ORPCError('INTERNAL_SERVER_ERROR');
		}

		const now = new Date();

		return {
			accessTokenExpiredAt: githubAccount.accessTokenExpiresAt,
			refreshTokenExpiredAt: githubAccount.refreshTokenExpiresAt,
			accessTokenExpiredAgo: `${formatDistance(now, githubAccount.accessTokenExpiresAt)} ago`,
			refreshTokenExpiredAgo: `${formatDistance(now, githubAccount.refreshTokenExpiresAt)} ago`,
			accessTokenExpired: isPast(githubAccount.accessTokenExpiresAt),
			refreshTokenExpired: isPast(githubAccount.accessTokenExpiresAt)
		};
	}),

	addGitHubUserToOrg: protectedProcedure.handler(async ({ context }) => {
		const {
			user,
			orgs,
			providerAccount: githubAccount,
			err
		} = await getGithubUserInformation(context);

		if (err) {
			throw err;
		}

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
			throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Could not accept invite' });
		}
	}),

	unlinkGitHubAccount: protectedProcedure.handler(async ({ context }) => {
		const { user, orgs, providerAccount, err, errType } = await getGithubUserInformation(context);

		if (err && errType !== 'Bad Credentials') {
			throw err;
		}

		if (!err) {
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
		}

		// Delete the provider account in the database
		await context.db.client
			.delete(context.db.schema.account)
			.where(eq(context.db.schema.account.id, providerAccount.id));
	}),

	setProfilePhotoToGithub: protectedProcedure.handler(async ({ context }) => {
		const { user, err } = await getGithubUserInformation(context);

		if (err) {
			throw err;
		}

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
