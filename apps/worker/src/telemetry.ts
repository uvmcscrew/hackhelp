import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BullMQOtel } from 'bullmq-otel';
import type { QueueTelemetry } from '@hackhelp/queue';

/**
 * Everything here is configured by environment variables — nothing is
 * hardcoded except the exporter type:
 *
 * - `OTLPTraceExporter` discovers `OTEL_EXPORTER_OTLP_ENDPOINT`,
 *   `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`,
 *   `OTEL_EXPORTER_OTLP_TRACES_HEADERS`, `OTEL_EXPORTER_OTLP_TIMEOUT` and
 *   `OTEL_EXPORTER_OTLP_COMPRESSION` (traces-specific vars win over generic).
 * - `NodeSDK`'s config detector additionally discovers `OTEL_SERVICE_NAME`,
 *   `OTEL_RESOURCE_ATTRIBUTES`, `OTEL_TRACES_SAMPLER` (+`*_ARG`),
 *   `OTEL_BSP_SCHEDULE_DELAY`/`_MAX_QUEUE_SIZE`/`_MAX_EXPORT_BATCH_SIZE`,
 *   and `OTEL_PROPAGATORS`.
 *
 * Set `OTEL_EXPORTER_OTLP_ENDPOINT` (e.g. an Axiom/Grafana/HyperDX ingest URL
 * or a local collector) and `OTEL_SERVICE_NAME` and traces start flowing.
 */
const sdk = new NodeSDK({
	traceExporter: new OTLPTraceExporter()
});

let started = false;

/** Registers the global tracer provider + context manager. Call once at boot. */
export function startTelemetry(): void {
	if (started) return;
	started = true;
	sdk.start();
	console.log('[worker] opentelemetry tracing started');
}

/**
 * BullMQ telemetry adapter for `createQueueWorker` options. Uses the globally
 * registered provider, so only call after `startTelemetry()`.
 */
export function createBullMqTelemetry(): QueueTelemetry {
	return new BullMQOtel({
		tracerName: process.env.OTEL_SERVICE_NAME ?? 'hackhelp-worker'
	});
}

/** Flushes pending spans. Call during graceful shutdown; never throws. */
export async function shutdownTelemetry(): Promise<void> {
	if (!started) return;
	try {
		await sdk.shutdown();
		console.log('[worker] opentelemetry spans flushed');
	} catch (err) {
		// unreachable collector must not block the worker from exiting
		console.warn('[worker] telemetry shutdown failed:', (err as Error).message);
	}
}
