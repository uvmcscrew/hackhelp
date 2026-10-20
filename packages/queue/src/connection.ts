import type { ConnectionOptions, JobsOptions } from 'bullmq';

/** Redis connection options accepted by producers and workers. */
export type QueueConnection = ConnectionOptions;

/**
 * Redis key prefix for all queues. Every BullMQ key will look like
 * `{prefix}:{queue}:...`. Keep this stable: changing it orphans existing queues.
 */
export const QUEUE_PREFIX = 'hackhelp';

/**
 * Build ioredis connection options from a redis URL.
 * Used by both producers (dispatch) and workers, so they can never drift.
 * The URL is an explicit parameter: this package never reads environment
 * variables itself, so each app supplies it from its own env system
 * (`$env/static/private` in SvelteKit, `process.env` under Bun, etc.).
 */
export function buildConnection(url: string): ConnectionOptions {
	const parsed = new URL(url);
	return {
		host: parsed.hostname,
		port: parsed.port ? Number(parsed.port) : 6379,
		username: parsed.username || undefined,
		password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
		db: parsed.pathname.length > 1 ? Number(parsed.pathname.slice(1)) : undefined,
		tls: parsed.protocol === 'rediss:' ? {} : undefined,
		// Required by BullMQ: blocking commands must not be retried mid-call
		maxRetriesPerRequest: null
	};
}

/**
 * Defaults applied to every dispatched job. Handlers can override per dispatch
 * (see DispatchOptions in ./dispatch).
 */
export const defaultJobOptions: JobsOptions = {
	attempts: 3,
	backoff: { type: 'exponential', delay: 5000 },
	removeOnComplete: true,
	// keep failed jobs around for inspection/retry until we have a cleaner
	removeOnFail: false
};
