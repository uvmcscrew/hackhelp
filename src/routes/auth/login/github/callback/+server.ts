import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';
import { githubOAuth } from '$lib/server/auth';

import type { RequestEvent } from './$types';
import type { OAuth2Tokens } from 'arctic';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { octokit } from '$lib/github';
import { logger } from '$lib/logger';
import { nanoid } from 'nanoid';
import { authenticatedUserOrgStatus } from '$lib/trpc/server/router/account';

export async function GET(event: RequestEvent): Promise<Response> {
	const reqId = event.request.headers.get('x-railway-request-id') ?? nanoid();
	const apiLogger = logger.child({
		route: '/auth/login/github/callback',
		method: 'GET',
		reqId
	});

	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('github_oauth_state') ?? null;

	apiLogger.info('Github OAuth callback', { code });

	// --------- Validate State ---------
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

	// --------- Validate Authorization Code ---------
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

	const { isInOrg: userInOrg, isAdmin: userIsAdmin } = await authenticatedUserOrgStatus(
		githubUserResponse.data.login,
		tokens.accessToken()
	);

	apiLogger.info('USER FOUND', { user: githubUserResponse.data.login, admin: userIsAdmin });

	// --------- Check Whitelist and Ban Status ---------
	apiLogger.info('Checking competitor list', { user: githubUserResponse.data.login });
	const [competitor] = await db
		.select({
			username: schema.profile.username,
			isWhitelisted: schema.profile.isWhitelisted,
			isBanned: schema.profile.isBanned
		})
		.from(schema.profile)
		.where(eq(schema.profile.username, githubUserResponse.data.login.toLowerCase()));

	if (competitor) {
		apiLogger.info('Competitor Found', { competitor });
		if (competitor.isBanned) {
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
		apiLogger.info('User not found in competitors, inserting', {
			user: githubUserResponse.data.login
		});
		await db.insert(schema.profile).values({
			username: githubUserResponse.data.login.toLowerCase(),
			role: userIsAdmin ? 'admin' : 'competitor',
			// Admins should be automatically whitelisted
			isWhitelisted: Boolean(userIsAdmin)
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
		knownStatus: competitor ?? 'no'
	});

	if (existingUser) {
		apiLogger.info('User already exists', { user: githubUserResponse.data.login });
		// Create and set session token
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, existingUser.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		// Update fullName, adminStatus
		await db
			.update(schema.user)
			.set({
				fullName: githubUserResponse.data.name,
				isOrgAdmin: Boolean(userIsAdmin),
				isOrgMember: userInOrg
			})
			.where(eq(schema.user.id, existingUser.id));

		await db
			.update(schema.profile)
			.set({
				linkedUserId: existingUser.id,
				isWhitelisted: userIsAdmin ? true : competitor?.isWhitelisted
			})
			.where(eq(schema.profile.username, githubUserResponse.data.login.toLowerCase()));

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

	apiLogger.info('Creating new user', { user: githubUserResponse.data.login });

	const [user] = await db
		.insert(schema.user)
		.values({
			username: githubUserResponse.data.login,
			githubId: githubUserResponse.data.id,
			fullName: githubUserResponse.data.name,
			isOrgAdmin: Boolean(userIsAdmin),
			isOrgMember: userInOrg
		})
		.returning();

	apiLogger.info('New User Created', {
		username: githubUserResponse.data.login,
		admin: userIsAdmin
	});

	// Link competitor to user
	await db
		.update(schema.profile)
		.set({ linkedUserId: user.id })
		.where(eq(schema.profile.username, githubUserResponse.data.login.toLowerCase()));

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
