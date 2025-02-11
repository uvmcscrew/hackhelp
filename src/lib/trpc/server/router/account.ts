import { protectedProcedure, publicProcedure, t } from '../shared';
import { eq } from 'drizzle-orm';
import { serverEnv } from '$lib/env/server';
import type { Context } from '../context';
import { TRPCError } from '@trpc/server';
import type { db as dbClient, schema as dbSchema } from '$lib/server/db';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { RequestError } from 'octokit';
import { githubApp, octokit } from '$lib/github';
import { generateState } from 'arctic';
import { githubOAuth } from '$lib/server/auth';

// #############################################
// #              ACCOUNT ROUTER               #
// #############################################

async function hasPendingInvite(ctx: Context & { user: { username: string } }) {
	const invites = await ctx.githubApp.rest.orgs.listPendingInvitations({
		org: serverEnv.PUBLIC_GITHUB_ORGNAME
	});

	const hasPendingInvite = invites.data.some((invite) => invite.login === ctx.user.username);

	return hasPendingInvite;
}

/**
 *
 * @param username the username to update
 * @param db an instance of teh database client
 * @param githubApp an instance of the github apps api client
 * @throws {RequestError} if the user is not a member of the organization
 */
export async function updateInvitedUser(
	username: string,
	db: { client: typeof dbClient; schema: typeof dbSchema },
	githubApp: typeof import('$lib/github').githubApp
) {
	const userIsMember = await githubApp.rest.orgs.getMembershipForUser({
		username,
		org: serverEnv.PUBLIC_GITHUB_ORGNAME
	});

	await db.client
		.update(db.schema.user)
		// If we get to this line, the user is a member of the organization. The api client will throw an error if they are not.
		.set({ isOrgMember: true, isOrgAdmin: userIsMember.data.role === 'admin' })
		.where(eq(db.schema.user.username, username));
}

export const accountRouter = t.router({
	whoami: protectedProcedure.query(({ ctx }) => {
		return { user: ctx.user };
	}),
	whoamiWithStatus: protectedProcedure.query(async ({ ctx }) => {
		const [userStatus] = await ctx.db
			.select()
			.from(ctx.dbSchema.userStatus)
			.where(eq(ctx.dbSchema.userStatus.linkedUserId, ctx.user.id));
		return { user: ctx.user, session: ctx.session, userStatus };
	}),
	hasPendingInvite: protectedProcedure.query(async ({ ctx }) => {
		const pendingInvite = await hasPendingInvite(ctx);
		return { hasPendingInvite: pendingInvite };
	}),
	sendInvite: protectedProcedure.mutation(async ({ ctx }) => {
		const pendingInvite = await hasPendingInvite(ctx);
		if (pendingInvite) {
			throw new TRPCError({ message: 'You already have a pending invite', code: 'UNAUTHORIZED' });
		}

		await ctx.githubApp.rest.orgs.createInvitation({
			org: serverEnv.PUBLIC_GITHUB_ORGNAME,
			invitee_id: ctx.user.githubId,
			role: 'direct_member'
		});

		return { invited: true };
	})
});

// #############################################
// #         AUTHENTICATION ROUTER             #
// #############################################

export async function authenticatedUserOrgStatus(username: string, accessToken: string) {
	let userInOrg: boolean;

	try {
		userInOrg = (
			await octokit.rest.orgs.listForAuthenticatedUser({
				headers: {
					Authorization: `Bearer ${accessToken}`
				}
			})
		).data.some((org) => org.login === serverEnv.PUBLIC_GITHUB_ORGNAME);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (e) {
		return { isInOrg: false, isAdmin: null };
	}

	if (userInOrg) {
		const userIsAdmin =
			(
				await githubApp.rest.orgs.getMembershipForUser({
					org: serverEnv.PUBLIC_GITHUB_ORGNAME,
					username: username
				})
			).data.role === 'admin';

		return { isInOrg: true, isAdmin: userIsAdmin };
	}

	return { isInOrg: false, isAdmin: null };
}

export const authRouter = t.router({
	getOAuthUrl: publicProcedure.query(async ({ ctx }) => {
		const state = generateState();
		const url = githubOAuth.createAuthorizationURL(state, ['read:user', 'user:email']);

		ctx.cookies.set('github_oauth_state', state, {
			path: '/',
			httpOnly: true,
			maxAge: 60 * 10,
			sameSite: 'lax'
		});

		return {
			url: url.toString()
		};
	})
});
