import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { createId as cuid2 } from '@paralleldrive/cuid2';
import { boolean } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey().$defaultFn(cuid2),
	githubId: integer('github_id').notNull(),
	username: text('username').notNull(),
	fullName: text('full_name'),
	isAdmin: boolean().default(false)
});

export const session = pgTable('session', {
	id: text('id').primaryKey().$defaultFn(cuid2),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at').notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;
