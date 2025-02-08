import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';
import { githubOAuth } from '$lib/server/auth';

import type { RequestEvent } from '@sveltejs/kit';
import type { OAuth2Tokens } from 'arctic';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { githubApp, octokit } from '$lib/github';
import { serverEnv } from '$lib/env/server';
import { logger } from '$lib/logger';

const apiLogger = logger.child({ route: '/auth/login/github/callback', method: 'GET' });

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('github_oauth_state') ?? null;

	apiLogger.info('Github OAuth callback', { code });

	if (code === null || state === null || storedState === null) {
		apiLogger.warn('Invalid state, 400 error', { error: 400, code });
		return Response.json(
			{
				status: 400,
				message: 'Invalid state'
			},
			{ status: 400 }
		);
	}
	if (state !== storedState) {
		apiLogger.warn('States do not match, 400 error', { error: 400, code });
		return Response.json(
			{
				status: 400,
				message: 'Incorrect state'
			},
			{ status: 400 }
		);
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await githubOAuth.validateAuthorizationCode(code);
	} catch (e: unknown) {
		const err = e as Error;
		// Invalid code or client credentials
		apiLogger.warn('Could not validate OAuth Authorization Code', { error: 400, code });
		return Response.json(
			{
				status: 400,
				message: 'Authorization code error',
				error: err.message
			},
			{ status: 400 }
		);
	}

	// --------- Get Github User Info ---------

	let githubUserResponse: { data: { login: string; name: string | null; id: number } };

	try {
		const res = await octokit.rest.users.getAuthenticated({
			headers: {
				Authorization: `Bearer ${tokens.accessToken()}`
			}
		});
		githubUserResponse = res;
	} catch (e: unknown) {
		const err = e as Error;
		apiLogger.warn('Could not get authenticated user', { error: 400, code, ghError: err });
		return Response.json(
			{
				status: 400,
				message: 'Could not get authenticated user',
				error: err.message
			},
			{ status: 400 }
		);
	}

	let userInOrg: boolean;

	try {
		userInOrg = (
			await octokit.rest.orgs.listForAuthenticatedUser({
				headers: {
					Authorization: `Bearer ${tokens.accessToken()}`
				}
			})
		).data.some((org) => org.login === serverEnv.PUBLIC_GITHUB_ORGNAME);
	} catch (e: unknown) {
		const err = e as Error;
		apiLogger.warn('Could not check if user is in organization', { error: 400, code, ghErr: err });
		return Response.json(
			{
				status: 400,
				message: 'Could not check if user is in organization',
				error: err.message
			},
			{ status: 400 }
		);
	}

	const userIsAdmin = userInOrg
		? // This API call will error if the user is not in the specified organization
			(
				await githubApp.rest.orgs.getMembershipForUser({
					org: serverEnv.PUBLIC_GITHUB_ORGNAME,
					username: githubUserResponse.data.login
				})
			).data.role === 'admin'
		: false;

	apiLogger.info('USER FOUND', { user: githubUserResponse.data.login, admin: userIsAdmin });

	// --------- Check Whitelist and Ban Status ---------
	const [userStatus] = await db
		.select({
			username: schema.userStatus.username,
			isWhitelisted: schema.userStatus.isWhitelisted,
			isBanned: schema.userStatus.isBanned
		})
		.from(schema.userStatus)
		.where(eq(schema.userStatus.username, githubUserResponse.data.login.toLowerCase()));

	apiLogger.info('USER STATUS', { userStatus });

	if (userStatus) {
		if (userStatus.isBanned) {
			apiLogger.warn('User is banned', { user: githubUserResponse.data.login });
			return Response.json(
				{
					message: 'you are banned'
				},
				{
					status: 403
				}
			);
		}
	} else {
		apiLogger.info('User not found in userStatus, inserting', {
			user: githubUserResponse.data.login
		});
		await db.insert(schema.userStatus).values({
			username: githubUserResponse.data.login,
			// Admins should be automatically whitelisted
			isWhitelisted: userIsAdmin
		});
	}

	// --------- Check if user already exists ---------
	const [existingUser] = await db
		.select({ id: schema.user.id })
		.from(schema.user)
		.where(eq(schema.user.githubId, githubUserResponse.data.id));

	apiLogger.info('USER AUTH INFO', {
		username: githubUserResponse.data.login,
		exists: Boolean(existingUser),
		knownStatus: userStatus ?? 'no'
	});

	if (existingUser) {
		// Create and set session token
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, existingUser.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		// Update fullName, adminStatus
		await db
			.update(schema.user)
			.set({
				fullName: githubUserResponse.data.name,
				isAdmin: userIsAdmin,
				isInOrganization: userInOrg,
				isWhitelisted: userIsAdmin ?? userStatus?.isWhitelisted ?? false
			})
			.where(eq(schema.user.id, existingUser.id));

		await db
			.update(schema.userStatus)
			.set({
				linkedUserId: existingUser.id,
				isWhitelisted: userIsAdmin ? true : userStatus?.isWhitelisted
			})
			.where(eq(schema.userStatus.username, githubUserResponse.data.login));

		apiLogger.info('Known User Logged In', {
			username: githubUserResponse.data.login,
			admin: userIsAdmin
		});

		return new Response(null, {
			status: 302,
			headers: {
				Location: userIsAdmin ? '/admin' : '/home'
			}
		});
	}

	const [user] = await db
		.insert(schema.user)
		.values({
			username: githubUserResponse.data.login,
			githubId: githubUserResponse.data.id,
			fullName: githubUserResponse.data.name,
			isAdmin: userIsAdmin,
			isInOrganization: userInOrg,
			isWhitelisted: userStatus?.isWhitelisted ?? false
		})
		.returning();

	apiLogger.info('New User Created', {
		username: githubUserResponse.data.login,
		admin: userIsAdmin
	});

	// Link userStatus to user
	await db
		.update(schema.userStatus)
		.set({ linkedUserId: user.id })
		.where(eq(schema.userStatus.username, githubUserResponse.data.login));

	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user.id);
	setSessionTokenCookie(event, sessionToken, session.expiresAt);

	return new Response(null, {
		status: 302,
		headers: {
			Location: userIsAdmin ? '/admin' : '/home'
		}
	});
}
