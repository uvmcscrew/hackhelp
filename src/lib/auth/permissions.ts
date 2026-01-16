import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements, adminAc } from 'better-auth/plugins/admin/access';

const statements = {
	configuration: ['view', 'update', 'delete'], // System configuration; key value table in postgres
	/**
	 * These are more administrator-like permissions
	 * If you have one of these, the action applies to all instances of that object in the system.
	 * i.e. as an administrator, I can view/list all teams, delete any team
	 */
	anyTeam: ['list', 'view', 'create', 'update', 'delete'],
	anyTicket: ['list', 'view', 'update', 'delete'],
	anyProfile: ['list', 'view', 'update', 'delete'],
	anyScore: ['create', 'view', 'update', 'delete'],
	/**
	 * Individual user permissions; what a user can do to resources they own/are a part of.
	 * i.e. can a user create a team, update their profile
	 */
	team: ['create', 'join', 'delete'],
	teamChallenge: ['update'],
	teamMembers: ['invite', 'remove'],
	profile: ['create', 'update', 'delete'],
	score: ['view'],
	/**
	 * Sections of the app that a user can view
	 */
	mentor: ['view'],
	judging: ['view']
} as const;

export const ac = createAccessControl({ ...defaultStatements, ...statements });

const admin = ac.newRole({
	...adminAc.statements,
	// ...ac.statements,
	configuration: ['view', 'update', 'delete'],
	team: ['create', 'join', 'delete'],
	mentor: ['view'],
	judging: ['view']
});

const verifiedUser = ac.newRole({
	profile: ['create']
});

const mentor = ac.newRole({
	mentor: ['view'],
	anyTeam: ['list', 'view'],
	anyTicket: ['list', 'view', 'update']
});

const judge = ac.newRole({
	judging: ['view'],
	anyTeam: ['list', 'view'],
	anyScore: ['create', 'view', 'update', 'delete']
});

export const roles = {
	admin,
	verifiedUser,
	mentor,
	judge
} as const;
