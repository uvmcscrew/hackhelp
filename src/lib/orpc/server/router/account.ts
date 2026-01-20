import { o, protectedProcedure } from '../shared';
import { eq } from 'drizzle-orm';
import { serverEnv } from '$lib/env/server';
import type { Context } from '../context';
import type DB from '$lib/server/db';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { RequestError } from 'octokit';
import { githubApp, octokit } from '$lib/github';
import { generateState } from 'arctic';
// import { githubOAuth } from '$lib/server/auth';
import type { User } from '$lib/server/db/schema';
import { ORPCError } from '@orpc/server';
import { auth } from '$lib/auth/server';
import { addRole, checkRolePermission } from '$lib/auth/permissions';

// #############################################
// #              ACCOUNT ROUTER               #
// #############################################

async function hasPendingInvite(ctx: Context & { user: { username: string } }) {
	const invites = await ctx.githubApp.rest.orgs.listPendingInvitations({
		org: serverEnv.PUBLIC_GITHUB_ORGNAME
	});

	// If the username is present in the list of pending invites, return true
	return invites.data.some((invite) => invite.login === ctx.user.username);
}

/**
 *
 * @param username the username to update
 * @param db an instance of teh database client
 * @param githubApp an instance of the github apps api client
 */
export async function updateInvitedUser(
	username: string,
	db: typeof DB,
	githubApp: typeof import('$lib/github').githubApp
) {
	let result: User;

	try {
		const userIsMember = await githubApp.rest.orgs.getMembershipForUser({
			username,
			org: serverEnv.PUBLIC_GITHUB_ORGNAME
		});

		result = (
			await db.client
				.update(db.schema.user)
				// If we get to this line, the user is a member of the organization. The api client will throw an error if they are not.
				.set({ isOrgMember: true, isOrgAdmin: userIsMember.data.role === 'admin' })
				.where(eq(db.schema.user.username, username))
				.returning()
		)[0];
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (e) {
		result = (
			await db.client
				.update(db.schema.user)
				.set({ isOrgMember: false, isOrgAdmin: false })
				.where(eq(db.schema.user.username, username))
				.returning()
		)[0];
	}

	return result;
}

export const accountRouter = {
	whoami: protectedProcedure.handler(({ context }) => {
		return { user: context.user };
	}),
	whoamiWithProfile: protectedProcedure.handler(async ({ context }) => {
		// await updateInvitedUser(
		// 	context.user.username,
		// 	{ client: context.db.client, schema: context.db.schema },
		// 	context.githubApp
		// );
		// const [userStatus] = await context.db.client
		// 	.select()
		// 	.from(context.db.schema.profile)
		// 	.where(eq(context.db.schema.profile.linkedUserId, context.user.id));
		return { user: context.user, session: context.session, userStatus };
	}),

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
		const accounts = await context.db.client
			.select()
			.from(context.db.schema.account)
			.where(eq(context.db.schema.account.userId, context.user.id));

		for (const acc of accounts) {
			if (acc.providerId === 'uvm-netid') return true;
		}

		return false;
	}),
	hasPendingInvite: protectedProcedure.handler(async ({ context }) => {
		const pendingInvite = await hasPendingInvite(context);
		return { hasPendingInvite: pendingInvite };
	}),
	sendInviteMutation: protectedProcedure.route({ method: 'POST' }).handler(async ({ context }) => {
		const rpclogger = context.logger.child({ procedure: 'account.sendInvite' });
		// Make sure DB state is accurate
		// const userstatus = await updateInvitedUser(
		// 	context.user.username,
		// 	{ client: context.db.client, schema: context.db.schema },
		// 	context.githubApp
		// );
		// if (userstatus.isOrgMember) {
		// 	rpclogger.info('User is already a member of the organization');
		// 	throw new ORPCError('UNAUTHORIZED', {
		// 		message: 'You are already a member of the organization'
		// 	});
		// }

		// const pendingInvite = await hasPendingInvite(context);
		// if (pendingInvite) {
		// 	rpclogger.warn('User already has a pending invite');
		// 	throw new ORPCError('UNAUTHORIZED', { message: 'You already have a pending invite' });
		// }

		// await context.githubApp.rest.orgs.createInvitation({
		// 	org: serverEnv.PUBLIC_GITHUB_ORGNAME,
		// 	invitee_id: context.user.githubId,
		// 	role: 'direct_member'
		// });

		return { invited: true };
	}),
	refreshInviteMutation: protectedProcedure
		.route({ method: 'POST' })
		.handler(async ({ context }) => {
			const rpclogger = context.logger.child({ procedure: 'account.refreshInvite' });

			// Make sure DB state is accurate
			// const userstatus = await updateInvitedUser(
			// 	context.user.username,
			// 	{ client: context.db.client, schema: context.db.schema },
			// 	context.githubApp
			// );
			// if (userstatus.isOrgMember) {
			// 	rpclogger.info('User is already a member of the organization');
			// 	return { refreshed: true, isMember: true };
			// }

			const pendingInvite = await hasPendingInvite(context);
			if (!pendingInvite) {
				rpclogger.warn('User does not have a pending invite');
				return { refreshed: false, isMember: false };
			}

			const orgmembers = await context.githubApp.rest.orgs.listMembers({
				org: serverEnv.PUBLIC_GITHUB_ORGNAME
			});

			const isMember = orgmembers.data.some((member) => member.login === context.user.username);

			rpclogger.info('User org membership status', { isMember });

			// if (isMember) {
			// 	rpclogger.info('User is a member of the organization, updating user status');
			// 	const result = await updateInvitedUser(
			// 		context.user.username,
			// 		{ client: context.db.client, schema: context.db.schema },
			// 		context.githubApp
			// 	);
			// 	rpclogger.info('User status updated', {
			// 		isOrgMember: result.isOrgMember,
			// 		isOrgAdmin: result.isOrgAdmin
			// 	});
			// }

			return { refreshed: true, isMember };
		})
};

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

export const authRouter = {
	getOAuthUrlMutation: o.route({ method: 'POST' }).handler(({ context: _ }) => {
		return false;
	})
};
