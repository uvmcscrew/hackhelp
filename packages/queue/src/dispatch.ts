import {
	Queue,
	type ConnectionOptions,
	type Job,
	type JobsOptions,
	type Telemetry
} from 'bullmq';
import { defaultJobOptions, QUEUE_PREFIX } from './connection';
import {
	jobSchemas,
	type JobData,
	type JobName,
	type QueueData,
	type QueueName,
	type QueueResult
} from './registry';

/**
 * Per-dispatch job options. See https://docs.bullmq.io/guide/jobs for what
 * each does; the short version:
 * - `delay`: ms to wait before the job becomes active
 * - `priority`: lower number runs first (within the same queue)
 * - `attempts`/`backoff`: override the retry defaults
 * - `deduplication`: `{ id, ttl }` — re-dispatching with the same id while a
 *   job with that id exists replaces/keeps it instead of adding a duplicate
 * - `jobId`: explicit job id (also useful for idempotency)
 */
export type DispatchOptions = Pick<
	JobsOptions,
	| 'jobId'
	| 'delay'
	| 'priority'
	| 'attempts'
	| 'backoff'
	| 'deduplication'
	| 'removeOnComplete'
	| 'removeOnFail'
>;

let config: QueueConfig | null = null;
const producerQueues = new Map<string, Queue>();

export type QueueConfig = {
	/**
	 * Redis connection for producer queues. Build it with `buildConnection(url)`
	 * from your app's own env source (e.g. `$env/static/private` in SvelteKit,
	 * `process.env` under Bun) — this package never reads env vars itself.
	 */
	connection: ConnectionOptions;
	/** Override the package-wide job defaults (attempts/backoff/removal). */
	defaultJobOptions?: JobsOptions;
	/**
	 * BullMQ telemetry (e.g. `BullMQOtel` from `bullmq-otel`). When set, each
	 * `dispatch()` stamps the currently active OpenTelemetry span context into
	 * the job's metadata, so the worker's job span nests under the dispatching
	 * request's trace. Requires a tracer provider registered in this process;
	 * without one, no context is stamped and worker spans become root spans.
	 */
	telemetry?: Telemetry;
};

/**
 * Configure the producer side of the queue once at startup, before any
 * `dispatch()`/`getQueue()` call:
 *
 * ```ts
 * // SvelteKit (e.g. hooks.server.ts)
 * import { REDIS_URL } from '$env/static/private';
 * configureQueue({ connection: buildConnection(REDIS_URL) });
 * ```
 *
 * Reconfiguring closes and drops any cached queues so they are rebuilt with
 * the new connection.
 */
export function configureQueue(next: QueueConfig): void {
	const stale = [...producerQueues.values()];
	producerQueues.clear();
	for (const queue of stale) void queue.close();
	config = next;
}

/** Lazily create and cache a raw BullMQ Queue for `name`. Prefer `dispatch()`. */
export function getQueue<Q extends QueueName>(
	name: Q
): Queue<QueueData<Q>, QueueResult<Q>, JobName<Q>> {
	if (!config) {
		throw new Error(
			`@hackhelp/queue is not configured. Call configureQueue({ connection: buildConnection(url) }) once at startup before dispatching "${name}".`
		);
	}
	let queue = producerQueues.get(name);
	if (!queue) {
		queue = new Queue(name, {
			connection: config.connection,
			prefix: QUEUE_PREFIX,
			defaultJobOptions: config.defaultJobOptions ?? defaultJobOptions,
			telemetry: config.telemetry
		});
		producerQueues.set(name, queue);
	}
	return queue as Queue<QueueData<Q>, QueueResult<Q>, JobName<Q>>;
}

/**
 * Submit a job. Requires `configureQueue()` to have been called at startup and
 * the dispatching service to have access to Redis — `queue.add` is an
 * acknowledged Redis write, so a resolved promise means the job is durably
 * queued.
 *
 * The payload is validated against the job's zod schema before being sent,
 * so producer-side bugs fail loudly at the call site instead of in a worker.
 *
 * ```ts
 * await dispatch('emails', 'send-otp', { to: 'a@b.c', type: 'sign-in', otp: '123456' });
 * ```
 */
export async function dispatch<Q extends QueueName, J extends JobName<Q>>(
	queueName: Q,
	jobName: J,
	data: JobData<Q, J>,
	opts?: DispatchOptions
): Promise<Job<JobData<Q, J>, QueueResult<Q>, J>> {
	const schemas = jobSchemas[queueName] as Record<
		string,
		{ parse(data: unknown): unknown }
	>;
	const schema = schemas[jobName];
	if (!schema) {
		throw new Error(`No schema registered for job "${queueName}:${jobName}"`);
	}
	schema.parse(data);
	const queue = getQueue(queueName);
	// the registry types above are the contract; BullMQ's own generics can't
	// express per-name payload narrowing, so the add call goes through loosely
	const job = await (queue as Queue).add(jobName, data, opts);
	return job as unknown as Job<JobData<Q, J>, QueueResult<Q>, J>;
}

/** Close all cached producer connections (graceful app shutdown, tests). */
export async function closeQueues(): Promise<void> {
	await Promise.all([...producerQueues.values()].map((queue) => queue.close()));
	producerQueues.clear();
}
