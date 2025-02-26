import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { createId as cuid2 } from '@paralleldrive/cuid2';
import { boolean } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';
import { customAlphabet } from 'nanoid';

export const user = pgTable('user', {
	id: text('id').primaryKey().$defaultFn(cuid2),
	githubId: integer('github_id').notNull(),
	username: text('username').notNull(),
	fullName: text('full_name'),
	isOrgAdmin: boolean().default(false).notNull(),
	isOrgMember: boolean().default(false).notNull(),
	teamId: text('team_id').references(() => team.id)
});

export type PersonRole = 'admin' | 'mentor' | 'competitor';

export const profile = pgTable('profile', {
	username: text('username').notNull().primaryKey(),
	role: text('role').$type<PersonRole>().default('competitor'),
	givenName: text('given_name'),
	email: text('email'),
	isWhitelisted: boolean().default(false).notNull(),
	isBanned: boolean().default(false).notNull(),
	linkedUserId: text('linked_user_id').references(() => user.id)
});

export const session = pgTable('session', {
	id: text('id').primaryKey().$defaultFn(cuid2),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at').notNull()
});

const simpleCode = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

export const team = pgTable('team', {
	id: text('id').primaryKey().$defaultFn(cuid2),
	githubId: integer('github_id').notNull(),
	githubSlug: text('github_slug').notNull(),
	name: text('name').notNull(),
	joinCode: text('join_code').notNull().unique().$defaultFn(simpleCode),
	canJoin: boolean().default(true).notNull(),
	selectedChallengeId: text('selected_challenge_id').references(() => challenge.id)
});

export const ticket = pgTable('ticket', {
	id: text('id').primaryKey().$defaultFn(cuid2),
	teamId: text('team_id').references(() => team.id),
	createdAt: timestamp('created_at').notNull(),
	issueId: integer('issue_id').notNull(),
	repository: text('repository').notNull(),
	title: text('title').notNull()
});

export const challenge = pgTable('challenge', {
	id: text('id').primaryKey().$defaultFn(cuid2),
	title: text('title').notNull(),
	linkedRepo: text('linked_repo').notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Team = typeof team.$inferSelect;

export type Ticket = typeof ticket.$inferSelect;

export type Challenge = typeof challenge.$inferSelect;
