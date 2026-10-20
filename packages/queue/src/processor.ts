import {
	Worker,
	type ConnectionOptions,
	type Job,
	type RateLimiterOptions,
	type Telemetry,
	type WorkerOptions
} from 'bullmq';
import { QUEUE_PREFIX } from './connection';
import {
	jobSchemas,
	type JobData,
	type JobName,
	type JobResult,
	type QueueData,
	type QueueName,
	type QueueResult
} from './registry';

/**
 * A single job handler. Receives the worker's context object and the job with
 * its payload typed to the exact schema for `J`.
 */
export type JobHandler<Q extends QueueName, J extends JobName<Q>, TContext> = (
	context: TContext,
	job: Job<JobData<Q, J>, JobResult<Q, J>, J>
) => Promise<JobResult<Q, J>>;

/** One handler per job name; the compiler rejects missing or extra handlers. */
export type ProcessorMap<Q extends QueueName, TContext> = {
	[J in JobName<Q>]: JobHandler<Q, J, TContext>;
};

export type QueueWorkerOptions = {
	/**
	 * Redis connection for this worker. Required: build it with
	 * `buildConnection(url)` from the app's own env source — this package
	 * never reads environment variables itself.
	 */
	connection: ConnectionOptions;
	concurrency?: number;
	/** Per-queue rate limit, e.g. SMTP throttling. */
	limiter?: RateLimiterOptions;
	/**
	 * BullMQ telemetry implementation (e.g. `BullMQOtel` from `bullmq-otel`).
	 * Emits spans for job processing through the globally registered
	 * OpenTelemetry tracer provider.
	 */
	telemetry?: Telemetry;
};

/** Re-exported so consumers can type telemetry without depending on bullmq. */
export type { Telemetry as QueueTelemetry } from 'bullmq';

/**
 * Create a BullMQ Worker for `queueName` that routes jobs by name to typed
 * handlers. `job.data` is validated against the job's zod schema before the
 * handler runs — workers never trust queue data.
 *
 * ```ts
 * const worker = createQueueWorker('emails', context, {
 *   'send-magic-link': async (ctx, job) => { ... },
 *   'send-otp': async (ctx, job) => { ... }
 * }, { connection: buildConnection(process.env.REDIS_URL!), concurrency: 5 });
 * ```
 */
export function createQueueWorker<Q extends QueueName, TContext>(
	queueName: Q,
	context: TContext,
	handlers: ProcessorMap<Q, TContext>,
	options: QueueWorkerOptions
): Worker<QueueData<Q>, QueueResult<Q>, JobName<Q>> {
	const schemas = jobSchemas[queueName] as Record<
		string,
		{ parse(data: unknown): unknown }
	>;

	const workerOptions: WorkerOptions = {
		connection: options.connection,
		prefix: QUEUE_PREFIX
	};
	// v6's Worker throws on explicitly-undefined concurrency — only set what's given
	if (options.concurrency !== undefined) workerOptions.concurrency = options.concurrency;
	if (options.limiter) workerOptions.limiter = options.limiter;
	if (options.telemetry) workerOptions.telemetry = options.telemetry;

	const worker = new Worker<QueueData<Q>, QueueResult<Q>, JobName<Q>>(
		queueName,
		async (job) => {
			const schema = schemas[job.name];
			if (!schema) {
				throw new Error(`No schema registered for job "${queueName}:${job.name}"`);
			}
			const handler = handlers[job.name] as (
				context: TContext,
				job: Job<never, never, never>
			) => Promise<QueueResult<Q>>;
			// validate at the worker boundary; replaces job.data with the parsed value
			job.data = schema.parse(job.data) as QueueData<Q>;
			return handler(context, job as never);
		},
		workerOptions
	);

	worker.on('failed', (job, err) => {
		console.error(
			`[queue] ${queueName}:${job?.name ?? 'unknown'} (job ${job?.id}) failed: ${err.message}`
		);
	});
	worker.on('error', (err) => {
		console.error(`[queue] ${queueName} worker error: ${err.message}`);
	});

	return worker;
}
