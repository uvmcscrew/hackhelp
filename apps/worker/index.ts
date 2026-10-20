import { configureQueue } from '@hackhelp/queue';
import { createContext, redisConnection } from './src/context';
import { createEmailWorker } from './src/processors/emails';
import { createBullMqTelemetry, shutdownTelemetry, startTelemetry } from './src/telemetry';

startTelemetry();

const connection = redisConnection();
// lets job handlers re-dispatch follow-up jobs, with trace context propagated
configureQueue({ connection, telemetry: createBullMqTelemetry() });

const context = createContext();
const workers = [createEmailWorker(context, connection)];

console.log(
	`[worker] started queues: ${workers.map((worker) => worker.name).join(', ')}`
);

let closing = false;
async function shutdown(signal: string): Promise<void> {
	if (closing) return;
	closing = true;
	console.log(`[worker] ${signal} received, draining jobs...`);
	await Promise.all(workers.map((worker) => worker.close()));
	await shutdownTelemetry();
	console.log('[worker] all workers closed');
	process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
