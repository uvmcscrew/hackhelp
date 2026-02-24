import { protectedProcedure } from '../shared';
import { and, eq } from 'drizzle-orm';
import { serverEnv } from '$lib/env/server';
import type { AuthedContext } from '../context';
import { octokit } from '$lib/github';
import { RequestError as OctokitRequestError } from 'octokit';
import { ORPCError, type } from '@orpc/server';
import { addRole, checkRolePermission } from '$lib/auth/permissions';
import { dev } from '$app/environment';
import { addSeconds, isPast } from 'date-fns';
import z from 'zod';
import { deserialize, serialize } from 'superjson';
import { personProfileRole, profileDataSchema, type ProfileData } from '$lib/schemas';
import { WHITELISTED_EMAIL_DOMAINS } from '$lib/utils';
import type { Account } from 'better-auth';

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

export async function getProviderAccounts(context: AuthedContext, providerId: string) {
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

/**
 * This function checks if a user is already verified, or if they are allowed to become verified
 * @param context The ORPC Context
 */
async function checkUserVerification(context: AuthedContext) {
	if (
		checkRolePermission({
			roles: context.user.role || '',
			permissions: { profile: ['create', 'update'] }
		})
	) {
		return { isVerified: true, canVerify: false };
	}

	const emailDomain = context.user.email.split('@')[1];

	// @ts-expect-error string is too general yeah yeah
	if (context.user.emailVerified && WHITELISTED_EMAIL_DOMAINS.includes(emailDomain)) {
		return {
			canVerify: true,
			isVerified: false
		};
	}

	const accounts = await context.db.client
		.select()
		.from(context.db.schema.account)
		.where(eq(context.db.schema.account.userId, context.user.id));

	for (const acc of accounts) {
		if (acc.providerId === 'uvm-netid') {
			return {
				canVerify: true,
				isVerified: false
			};
		}
	}

	return { canVerify: false, isVerified: false };
}

async function verifyUser(context: AuthedContext) {
	await context.db.client
		.update(context.db.schema.user)
		.set({ role: addRole(context.user.role || '', 'verifiedUser').join(',') })
		.where(eq(context.db.schema.user.id, context.user.id));
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

async function refreshGithubAccessToken(
	context: AuthedContext,
	providerAccount: Account
): Promise<
	| { refreshed: false; accessToken?: never; error: string }
	| { refreshed: true; accessToken: string; error?: never }
> {
	if (!providerAccount.accessToken) return { refreshed: false, error: 'Missing access token' };
	// If there is no expiry for the access token, that means we have a non-expiring token
	if (!providerAccount.accessTokenExpiresAt) {
		return { refreshed: true, accessToken: providerAccount.accessToken };
	}

	// Ensure we have the necessary info for refreshing
	if (!providerAccount.refreshToken || !providerAccount.refreshTokenExpiresAt)
		return { refreshed: false, error: 'Missing refresh token or refresh token expiry' };

	if (isPast(providerAccount.refreshTokenExpiresAt)) {
		// Can't refresh with an invalid refresh token
		return { refreshed: false, error: 'Refresh token is expired' };
	}

	// Form API call to refresh the access token
	// https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens
	const refreshURL = new URL('https://github.com/login/oauth/access_token');
	refreshURL.searchParams.set('client_id', serverEnv.GITHUB_APP_CLIENT_ID);
	refreshURL.searchParams.set('client_secret', serverEnv.GITHUB_APP_CLIENT_SECRET);
	refreshURL.searchParams.set('grant_type', 'refresh_token');
	refreshURL.searchParams.set('refresh_token', providerAccount.refreshToken);

	// Hit API
	const refreshResponse = await fetch(refreshURL, {
		method: 'POST'
	});

	const refreshResBody = new URLSearchParams(await refreshResponse.text());

	const accessToken = refreshResBody.get('access_token');
	const expirySeconds = parseInt(refreshResBody.get('expires_in') || '0');

	// If there's an error or we're missing some values, return an error
	if (!refreshResponse.ok || refreshResBody.get('error') || !accessToken || expirySeconds === 0) {
		return {
			refreshed: false,
			error: refreshResBody.get('error_description') ?? 'Failed to refresh access token'
		};
	}

	const expiryDate = addSeconds(new Date(), expirySeconds);

	// Update database
	await context.db.client
		.update(context.db.schema.account)
		.set({
			accessToken,
			accessTokenExpiresAt: expiryDate
		})
		.where(eq(context.db.schema.account.id, providerAccount.id));

	return { refreshed: true, accessToken };
}

async function getGithubUserInformation(context: AuthedContext): Promise<GithubUserInformation> {
	const accounts = await getProviderAccounts(context, 'github');

	if (accounts.length === 0)
		throw new ORPCError('BAD_REQUEST', {
			message: 'You must have a linked GitHub account to make this request'
		});

	const githubAccount = accounts[0];

	// Check access token expiry, and refresh if necessary
	if (githubAccount.accessTokenExpiresAt && isPast(githubAccount.accessTokenExpiresAt)) {
		const { refreshed, accessToken, error } = await refreshGithubAccessToken(
			context,
			githubAccount
		);

		if (!refreshed) {
			return {
				err: new ORPCError('INTERNAL_SERVER_ERROR', {
					message: `Failed to refresh GitHub access token: ${error}`
				}),
				errType: error,
				providerAccount: githubAccount
			};
		}

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

type MicrosoftGraphUserInformation = {
	sub: string;
	name: string;
	picture: string;
	family_name: string;
	given_name: string;
	email: string;
};

type MLHUserProfile = {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	phone_number: string | null;
	level_of_study: string | null;
	major: string | null;
	date_of_birth: string | null;
	gender: string | null;
	school: { id: number; name: string } | null;
};

type GetGithubProfile =
	| { hasGithubProfile: false; message: string; orgStatus?: never; profile?: never }
	| {
			hasGithubProfile: true;
			message?: never;
			orgStatus: 'joined' | 'invited' | 'unknown';
			profile: { username: string; fullName: string | null; avatar: string };
	  };

export const accountRouter = {
	updateName: protectedProcedure
		.input(z.object({ newName: z.string() }))
		.handler(async ({ context, input }) => {
			await context.db.client
				.update(context.db.schema.user)
				.set({ name: input.newName })
				.where(eq(context.db.schema.user.id, context.user.id));
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

	getUvmProfile: protectedProcedure.handler(async ({ context }) => {
		const accounts = await getProviderAccounts(context, 'uvm-netid');

		if (accounts.length === 0)
			throw new ORPCError('BAD_REQUEST', {
				message: 'You must have a linked UVM NetID account to make this request'
			});

		const uvmAccount = accounts[0];

		const accessTokenExpired = uvmAccount.accessTokenExpiresAt
			? isPast(uvmAccount.accessTokenExpiresAt)
			: false;

		if (accessTokenExpired) {
			return {
				accessTokenExpired: true
			};
		}

		const userinfoResponse = await fetch('https://graph.microsoft.com/oidc/userinfo', {
			headers: {
				Authorization: `Bearer ${uvmAccount.accessToken}`
			}
		});

		if (!userinfoResponse.ok) {
			console.error('Failed to fetch UVM profile', await userinfoResponse.text());
			throw new ORPCError('INTERNAL_SERVER_ERROR', {
				message: 'Failed to fetch UVM profile'
			});
		}

		const userinfo = (await userinfoResponse.json()) as MicrosoftGraphUserInformation;

		// Fetch the profile photo
		//
		const pfpRawResponse = await fetch(userinfo.picture, {
			headers: {
				Authorization: `Bearer ${uvmAccount.accessToken}`
			}
		});

		// console.log({ pfpRawResponse });

		const base64pfp = `data:image/jpeg;base64,${Buffer.copyBytesFrom(await pfpRawResponse.bytes()).toString('base64')}`;

		userinfo.picture = base64pfp;

		return { accessTokenExpired, userinfo };
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

		if (githubAccount.accessToken && !githubAccount.accessTokenExpiresAt) {
			return {
				needsRefresh: false
			};
		}

		if (!githubAccount.accessTokenExpiresAt || !githubAccount.refreshTokenExpiresAt) {
			throw new ORPCError('INTERNAL_SERVER_ERROR');
		}

		return {
			needsRefresh: isPast(githubAccount.accessTokenExpiresAt),
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
	}),

	getMlhProfile: protectedProcedure.handler(async ({ context }) => {
		const accounts = await getProviderAccounts(context, 'mlh');

		if (accounts.length === 0)
			throw new ORPCError('BAD_REQUEST', {
				message: 'You must have a linked MLH account to make this request'
			});

		const mlhAccount = accounts[0];

		const accessTokenExpired = mlhAccount.accessTokenExpiresAt
			? isPast(mlhAccount.accessTokenExpiresAt)
			: false;

		if (accessTokenExpired) {
			return { accessTokenExpired: true as const, profile: null };
		}

		const profileResponse = await fetch('https://my.mlh.io/api/v4/user.json', {
			headers: {
				Authorization: `Bearer ${mlhAccount.accessToken}`
			}
		});

		if (!profileResponse.ok) {
			console.error('Failed to fetch MLH profile', await profileResponse.text());
			throw new ORPCError('INTERNAL_SERVER_ERROR', {
				message: 'Failed to fetch MLH profile'
			});
		}

		const body = (await profileResponse.json()) as { data: MLHUserProfile };
		return { accessTokenExpired: false as const, profile: body.data };
	}),

	importProfileFromMlh: protectedProcedure.handler(async ({ context }) => {
		const accounts = await getProviderAccounts(context, 'mlh');

		if (accounts.length === 0)
			throw new ORPCError('BAD_REQUEST', {
				message: 'You must have a linked MLH account to make this request'
			});

		const mlhAccount = accounts[0];

		const accessTokenExpired = mlhAccount.accessTokenExpiresAt
			? isPast(mlhAccount.accessTokenExpiresAt)
			: false;

		if (accessTokenExpired)
			throw new ORPCError('UNAUTHORIZED', { message: 'MLH access token has expired' });

		const profileResponse = await fetch('https://my.mlh.io/api/v4/user.json', {
			headers: {
				Authorization: `Bearer ${mlhAccount.accessToken}`
			}
		});

		if (!profileResponse.ok) {
			console.error('Failed to fetch MLH profile for import', await profileResponse.text());
			throw new ORPCError('INTERNAL_SERVER_ERROR', {
				message: 'Failed to fetch MLH profile'
			});
		}

		const body = (await profileResponse.json()) as { data: MLHUserProfile };
		const mlhProfile = body.data;

		const fullName = [mlhProfile.first_name, mlhProfile.last_name].filter(Boolean).join(' ');

		if (fullName) {
			await context.db.client
				.update(context.db.schema.user)
				.set({ name: fullName })
				.where(eq(context.db.schema.user.id, context.user.id));
		}

		return { name: fullName || null };
	}),

	profile: {
		canInitialize: protectedProcedure.handler(async ({ context }) => {
			if (
				checkRolePermission({
					roles: context.user.role || '',
					permissions: { profile: ['create'] }
				})
			)
				return true;

			const verificationStatus = await checkUserVerification(context);

			if (verificationStatus.isVerified) return true;
			if (verificationStatus.canVerify) return true;

			return false;
		}),
		initialize: protectedProcedure
			.input(z.object({ primaryRole: personProfileRole }))
			.handler(async ({ context, input }) => {
				const verificationStatus = await checkUserVerification(context);

				if (!verificationStatus.canVerify && !verificationStatus.isVerified) {
					throw new ORPCError('UNAUTHORIZED', {
						message: 'You are not eligible for verification'
					});
				}

				if (verificationStatus.canVerify) {
					await verifyUser(context);
				}

				const roles = (context.user.role || '').split(',');

				// Check if the user is requesting a primaryRole that they are not authorized to have
				if (input.primaryRole !== 'competitor') {
					if (!roles.includes(input.primaryRole)) {
						throw new ORPCError('UNAUTHORIZED', {
							message: 'Missing required role to become Mentor or Judge'
						});
					}
				}

				// Second, check if the user has a profile and if so, reject the request
				const existingProfiles = await context.db.client
					.select()
					.from(context.db.schema.profile)
					.where(eq(context.db.schema.profile.id, context.user.id));

				if (existingProfiles.length !== 0)
					throw new ORPCError('BAD_REQUEST', {
						message: 'Cannot create profile - you already have one'
					});

				// Initial profileData object with default values
				const profileData = profileDataSchema.parse({ mainlineDietaryRestrictions: {} });

				// Create the profile with the initial role information
				await context.db.client.insert(context.db.schema.profile).values({
					id: context.user.id,
					primaryRole: input.primaryRole,
					data: serialize(profileData)
				});
			}),
		get: protectedProcedure.handler(async ({ context }) => {
			const existingProfiles = await context.db.client
				.select()
				.from(context.db.schema.profile)
				.where(eq(context.db.schema.profile.id, context.user.id));

			if (existingProfiles.length === 0) return null;

			const profile = existingProfiles[0];
			const profileData = deserialize<ProfileData>(profile.data);

			return {
				profile: {
					...profile,
					data: profileData
				}
			};
		}),
		update: protectedProcedure
			// TODO: add stuff for affiliation here
			.input(z.object({ data: profileDataSchema, primaryRole: personProfileRole.optional() }))
			.handler(async ({ context, input }) => {
				if (
					!checkRolePermission({
						roles: context.user.role || '',
						permissions: { profile: ['update'] }
					})
				) {
					throw new ORPCError('UNAUTHORIZED', {
						message: 'You do not have permission to update a profile'
					});
				}
				const roles = (context.user.role || '').split(',');

				// First, check if the user is requesting a primaryRole that they are not authorized to have
				// This runs first because it does not require a database query
				if (input.primaryRole) {
					if (!(input.primaryRole === 'competitor')) {
						if (!roles.includes(input.primaryRole)) {
							throw new ORPCError('UNAUTHORIZED', {
								message: 'Missing required role to become Mentor or Judge'
							});
						}
					}
				}

				const existingProfiles = await context.db.client
					.select()
					.from(context.db.schema.profile)
					.where(eq(context.db.schema.profile.id, context.user.id));

				if (existingProfiles.length === 0)
					throw new ORPCError('BAD_REQUEST', {
						message: 'You do not have a profile'
					});

				const existingProfile = existingProfiles[0];

				const newProfile = (
					await context.db.client
						.update(context.db.schema.profile)
						.set({
							primaryRole: input.primaryRole || existingProfile.primaryRole,
							data: serialize(input.data)
						})
						.where(eq(context.db.schema.profile.id, context.user.id))
						.returning()
				)[0];

				return {
					profile: {
						...newProfile,
						data: input.data
					}
				};
			})
	}
};
