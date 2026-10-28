import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PostgresInstrumentation } from 'otel-instrumentation-postgres';

const sdk = new NodeSDK({
	traceExporter: new OTLPTraceExporter(),
	instrumentations: [
		new PostgresInstrumentation({
			serviceName: process.env.OTEL_SERVICE_NAME ?? 'hackhelp',
			collectQueryParameters: true,
			enableHistogram: true
		})
	]
});

sdk.start();
console.log('[hackhelp] opentelemetry tracing started');

process.on('SIGTERM', async () => {
	try {
		await sdk.shutdown();
		console.log('[hackhelp] opentelemetry spans flushed');
	} catch (err) {
		console.warn('[hackhelp] telemetry shutdown failed:', (err as Error).message);
	}
	process.exit(0);
});

process.on('SIGINT', async () => {
	try {
		await sdk.shutdown();
		console.log('[hackhelp] opentelemetry spans flushed');
	} catch (err) {
		console.warn('[hackhelp] telemetry shutdown failed:', (err as Error).message);
	}
	process.exit(0);
});
