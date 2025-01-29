import { sqliteTable, text, integer, int } from 'drizzle-orm/sqlite-core';
import { createId as cuid2 } from '@paralleldrive/cuid2';

export const user = sqliteTable('user', {
	id: text('id').primaryKey().$defaultFn(cuid2),
	githubId: int('github_id').notNull(),
	username: text('username').notNull(),
	fullName: text('full_name')
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey().$defaultFn(cuid2),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;
