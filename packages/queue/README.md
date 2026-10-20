# @hackhelp/queue

Typed job queue abstraction over [BullMQ](https://docs.bullmq.io) v6, backed by Redis.

This package is the **single source of truth** for job payloads and dispatching.
Both the web app (producer) and `apps/worker` (consumer) import it, so a job's
payload type is checked at the dispatch call site *and* validated at runtime in
the worker.

## Prerequisites

This package **never reads environment variables itself** — every app supplies
its Redis URL explicitly through its own env system (`$env/static/private` in
SvelteKit, `process.env` under Bun, a config service, whatever). Configure the
producer side **once at startup**:

```ts
// SvelteKit, e.g. src/hooks.server.ts
import { REDIS_URL } from '$env/static/private';
import { buildConnection, configureQueue } from '@hackhelp/queue';

configureQueue({ connection: buildConnection(REDIS_URL) });
```

```ts
// Bun / Node, e.g. the worker app
configureQueue({ connection: buildConnection(process.env.REDIS_URL!) });
```

Any service that dispatches jobs needs direct access to Redis — this is the
standard BullMQ model: `queue.add` is an acknowledged Redis write, so a
resolved `dispatch()` promise means the job is durably queued. Calling
`dispatch`/`getQueue` before `configureQueue` throws with a message telling you
exactly what to do.

## Submitting a job

```ts
import { dispatch } from '@hackhelp/queue';

await dispatch('emails', 'send-otp', {
	to: 'student@uvm.edu',
	type: 'sign-in',
	otp: '4f8a2b'
});
```

- The first two arguments pick the queue and job name; **TypeScript then infers
  the exact payload type**, so a missing or misspelled field is a compile error.
- The payload is validated against the job's zod schema before being sent, so
  bad data fails loudly at the call site instead of inside a worker.
- `dispatch` returns the created BullMQ `Job` (id, etc.).

### Dispatch options

```ts
await dispatch(
	'emails',
	'send-magic-link',
	{ to, magicLink },
	{
		delay: 60_000, // ms before the job becomes active
		priority: 10, // lower runs first within a queue
		attempts: 5, // override the default 3 retries
		backoff: { type: 'exponential', delay: 2000 },
		deduplication: { id: `otp-${userId}`, ttl: 30_000 }, // collapse repeats
		jobId: 'stable-job-id' // idempotency handle
	}
);
```

Default job options (3 attempts, exponential backoff, remove on complete) live
in `src/connection.ts` and apply unless overridden.

## Adding a new job type

1. **Define a zod schema + inferred type** in `src/jobs/<domain>.ts`. Keep
   payloads JSON-safe primitives only (strings, numbers, booleans, plain
   objects/arrays; ISO strings for dates). Never put DB entities, `Date`
   objects, class instances, `undefined`, or functions in a payload — BullMQ
   round-trips data through `JSON.stringify`. Pass IDs and re-fetch in the
   worker so jobs never operate on stale state.
2. **Register it** in `src/registry.ts`: add an entry to the `JobRegistry`
   interface (`{ data; return }`) and the matching schema in `jobSchemas`.
   The compiler enforces that the two stay in sync — a missing schema or a
   payload type mismatch is a build error.
3. **Handle it** in `apps/worker/src/processors/<domain>.ts` inside the
   `createQueueWorker` handler map. New job names in a queue show up as a type
   error until a handler exists.

For a brand-new domain (e.g. `github`), add a new key to `JobRegistry` and
`jobSchemas`, then create a second `createQueueWorker('github', ...)` call in
the worker and append it to the `workers` array in `apps/worker/index.ts`. Each
queue gets its own concurrency, rate limit, and priority isolation inside the
single worker process.

## Consuming jobs (worker side)

```ts
import { buildConnection, createQueueWorker } from '@hackhelp/queue';

const worker = createQueueWorker(
	'emails',
	context, // typed WorkerContext from apps/worker
	{
		'send-otp': async (ctx, job) => {
			// job.data is fully typed and zod-validated here
			await ctx.email.sendEmailOtp(job.data.to, { ... });
		}
	},
	{
		connection: buildConnection(process.env.REDIS_URL!), // required, explicit
		concurrency: 5,
		limiter: { max: 50, duration: 1000 } // optional rate limit
	}
);
```

- Handlers receive `(context, job)`; `job.data` is parsed and narrowed to that
  job's type before the handler runs.
- Throwing from a handler marks the job failed and triggers the retry/backoff
  policy. Handlers should be idempotent — retries re-run them with the same
  payload.
- `failed`/`error` events are logged by the wrapper.
- Pass `telemetry` (e.g. `new BullMQOtel()` from `bullmq-otel`) to emit
  OpenTelemetry spans for job processing; the worker app wires this through its
  global `NodeSDK`/OTLP setup in `apps/worker/src/telemetry.ts`.

## Escape hatches

- `getQueue('emails')` returns the raw cached BullMQ `Queue` for bulk adds,
  counts, pausing, job schedulers (`upsertJobScheduler` for cron-style work),
  etc.
- `closeQueues()` closes producer connections on graceful shutdown (the worker
  app closes its `Worker`s directly).
- `buildConnection(url)` / `QUEUE_PREFIX` (`hackhelp`) are shared so producers
  and workers can never drift in connection settings or key namespace.

## Tracing (OpenTelemetry)

Both sides accept a `telemetry` implementation (use `BullMQOtel` from
`bullmq-otel`). Nesting across services is driven by context propagation, not
by the backend:

- **Producer** (`configureQueue({ connection, telemetry })`): each `dispatch()`
  stamps the *currently active span context* into the job's metadata.
- **Worker** (`createQueueWorker(..., { telemetry })`): restores that context
  before running the handler, so the job span is a child of the dispatch span.

End result on a shared backend (e.g. Railway): a web request that dispatches a
job produces **one merged trace** — request span → dispatch span → job span →
DB/SMTP child spans. If the producer has no telemetry or no active span, the
worker span simply becomes a root span; it is still recorded.

```ts
// SvelteKit example: request → dispatch → job all in one trace
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BullMQOtel } from 'bullmq-otel';
import { REDIS_URL } from '$env/static/private';

new NodeSDK({ traceExporter: new OTLPTraceExporter() }).start();
configureQueue({
	connection: buildConnection(REDIS_URL),
	telemetry: new BullMQOtel({ tracerName: 'hackhelp-web' })
});
```

## Notes

- **Do not import `@hackhelp/db` or `@hackhelp/emails` from this package.** It
  must stay dependency-light (bullmq, ioredis, zod) so web services can
  dispatch without pulling in worker code. Execution context lives in
  `apps/worker`.
- Redis >= 6.2 required by BullMQ v6. Locally: `redis://localhost:32701`
  (see `compose.yml` once the redis service is added there).
- BullMQ v6 gotchas: repeatable jobs are replaced by Job Schedulers
  (`queue.upsertJobScheduler`), and `debounce` is replaced by the
  `deduplication` dispatch option.
