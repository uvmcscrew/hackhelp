import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';
import { githubOAuth } from '$lib/server/auth';

import type { RequestEvent } from '@sveltejs/kit';
import type { OAuth2Tokens } from 'arctic';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { githubApp, octokit } from '$lib/github';
import { serverEnv } from '$lib/env/server';

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('github_oauth_state') ?? null;
	if (code === null || state === null || storedState === null) {
		return Response.json(
			{
				status: 400,
				message: 'Invalid state'
			},
			{ status: 400 }
		);
	}
	if (state !== storedState) {
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
	const githubUserResponse = await octokit.rest.users.getAuthenticated({
		headers: {
			Authorization: `Bearer ${tokens.accessToken()}`
		}
	});

	const userInOrg = (
		await octokit.rest.orgs.listForAuthenticatedUser({
			headers: {
				Authorization: `Bearer ${tokens.accessToken()}`
			}
		})
	).data.some((org) => org.login === serverEnv.PUBLIC_GITHUB_ORGNAME);

	const userIsAdmin = userInOrg
		? // This API call will error if the user is not in the specified organization
			(
				await githubApp.rest.orgs.getMembershipForUser({
					org: serverEnv.PUBLIC_GITHUB_ORGNAME,
					username: githubUserResponse.data.login
				})
			).data.role === 'admin'
		: false;

	// --------- Check Whitelist and Ban Status ---------
	const [userStatus] = await db
		.select({
			username: schema.userStatus.username,
			isWhitelisted: schema.userStatus.isWhitelisted,
			isBanned: schema.userStatus.isBanned
		})
		.from(schema.userStatus)
		.where(eq(schema.userStatus.username, githubUserResponse.data.login.toLowerCase()));

	if (userStatus) {
		console.log('userStatus', JSON.stringify(userStatus, null, 2));
		if (userStatus.isBanned) {
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
		console.log('userStatus not found, creating');
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

	console.log(
		'USER AUTH INFO',
		JSON.stringify(
			{
				username: githubUserResponse.data.login,
				exists: Boolean(existingUser),
				knownStatus: userStatus ?? 'no'
			},
			null,
			2
		)
	);

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

		console.log('known user logged in');

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

	console.log('new user created');

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
