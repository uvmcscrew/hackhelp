import {
	pgTable,
	text,
	integer,
	boolean,
	timestamp,
	json,
	index,
	primaryKey
} from 'drizzle-orm/pg-core';
import { createId as cuid2 } from '@paralleldrive/cuid2';
import { customAlphabet } from 'nanoid';
import type { WorkRooms } from '$lib/utils';
import { user } from './auth';
import type { PersonProfileRole } from '$lib/schemas';
import type { SuperJSONResult } from 'superjson';

export const configuration = pgTable(
	'configuration',
	{
		key: text('key').primaryKey(),
		lastUpdated: timestamp('last_updated').notNull().defaultNow(),
		value: json('value').notNull().$type<SuperJSONResult>()
	},
	(table) => [index('configuration_key_idx').on(table.key)]
);

export const profile = pgTable(
	'profile',
	{
		id: text('id')
			.primaryKey()
			.references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		primaryRole: text('role').$type<PersonProfileRole>().default('competitor'),
		affiliation: text('affiliation'),
		data: json('data').$type<SuperJSONResult>().notNull()
	},
	(table) => [index('profile_userId_idx').on(table.id)]
);

const hexCode = customAlphabet('abcdef0123456789', 6);

export const team = pgTable('team', {
	id: text('id').primaryKey().$defaultFn(cuid2),
	githubId: integer('github_id'),
	githubSlug: text('github_slug'),
	name: text('name').notNull(),
	joinCode: text('join_code').notNull().unique().$defaultFn(hexCode),
	canJoin: boolean().default(true).notNull(),
	isPublic: boolean().default(true).notNull(),
	selectedChallengeId: text('selected_challenge_id').references(() => challenge.id)
});

export const teamMembers = pgTable(
	'teamMember',
	{
		teamId: text('teamId').references(() => team.id),
		userId: text('userId').references(() => user.id)
	},
	(t) => [primaryKey({ columns: [t.teamId, t.userId] })]
);

export const TICKET_RESOLUTION_STATUS = ['open', 'assigned', 'inProgress', 'closed'] as const;
export type TicketResolutionStatus = (typeof TICKET_RESOLUTION_STATUS)[number];

// export const ticket = pgTable('ticket', {
// 	id: text('id').primaryKey().$defaultFn(cuid2),
// 	teamId: text('team_id').references(() => team.id),
// 	challengeId: text('challenge_id').references(() => challenge.id),
// 	createdAt: timestamp('created_at').notNull(),
// 	issueNumber: integer('issue_number').notNull(),
// 	repository: text('repository').notNull(),
// 	title: text('title').notNull(),
// 	location: text('location').notNull().$type<WorkRooms>(),
// 	locationDescription: text('location_description'),
// 	assignedMentor: text('assigned_mentor').references(() => user.id),
// 	resolutionStatus: text('resolution_status')
// 		.default('open')
// 		.notNull()
// 		.$type<TicketResolutionStatus>()
// });

export const challenge = pgTable('challenge', {
	id: text('id').primaryKey().$defaultFn(cuid2),
	title: text('title').notNull(),
	description: text('descr'),
	linkedRepo: text('linked_repo')
});

export * from './auth';

// export type Session = typeof session.$inferSelect;

// export type User = typeof user.$inferSelect;

// export type Team = typeof team.$inferSelect;

// export type Ticket = typeof ticket.$inferSelect;

// export type Challenge = typeof challenge.$inferSelect;
