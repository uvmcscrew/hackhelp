import type { ZodType } from 'zod';
import {
	sendMagicLinkSchema,
	sendOtpSchema,
	type SendMagicLinkData,
	type SendOtpData
} from './jobs/emails';

/**
 * Central map of every queue, its jobs, and each job's payload/return types.
 * This is the single source of truth shared by producers (web app) and
 * consumers (apps/worker). Adding a job = add a schema in ./jobs, an entry
 * here, and a matching entry in `jobSchemas` below (the compiler enforces it).
 */
export interface JobRegistry {
	emails: {
		// eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- job results are property types in this registry map
		'send-magic-link': { data: SendMagicLinkData; return: void };
		// eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- job results are property types in this registry map
		'send-otp': { data: SendOtpData; return: void };
	};
}

/**
 * Runtime validation schemas, kept in sync with JobRegistry by the compiler.
 * Workers parse `job.data` with these before invoking any handler.
 */
export const jobSchemas = {
	emails: {
		'send-magic-link': sendMagicLinkSchema,
		'send-otp': sendOtpSchema
	}
} satisfies {
	[Q in keyof JobRegistry]: {
		[J in keyof JobRegistry[Q]]: ZodType<
			JobRegistry[Q][J] extends { data: infer D } ? D : never
		>;
	};
};

export type QueueName = keyof JobRegistry;

export type JobName<Q extends QueueName> = keyof JobRegistry[Q] & string;

// Conditional inference instead of `JobRegistry[Q][J]['data']`: nested indexed
// accesses over generic keys are deferred and TS refuses to index them with
// literal keys. These resolve correctly at instantiation.
export type JobData<Q extends QueueName, J extends JobName<Q>> =
	JobRegistry[Q][J] extends { data: infer D } ? D : never;

export type JobResult<Q extends QueueName, J extends JobName<Q>> =
	JobRegistry[Q][J] extends { return: infer R } ? R : never;

/** Union of all payload types flowing through one queue (BullMQ's DataType). */
export type QueueData<Q extends QueueName> =
	JobRegistry[Q][JobName<Q>] extends { data: infer D } ? D : never;

/** Union of all return types produced by one queue (BullMQ's ResultType). */
export type QueueResult<Q extends QueueName> =
	JobRegistry[Q][JobName<Q>] extends { return: infer R } ? R : never;
