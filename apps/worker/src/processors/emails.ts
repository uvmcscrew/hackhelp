import { createQueueWorker, type QueueConnection } from '@hackhelp/queue';
import type { WorkerContext } from '../context';
import { createBullMqTelemetry } from '../telemetry';

export function createEmailWorker(
	context: WorkerContext,
	connection: QueueConnection
) {
	return createQueueWorker(
		'emails',
		context,
		{
			'send-magic-link': async ({ email }, job) => {
				await email.sendMagicLinkEmail(job.data.to, {
					magicLink: job.data.magicLink,
					username: job.data.username,
					fromIp: job.data.fromIp
				});
			},
			'send-otp': async ({ email }, job) => {
				await email.sendEmailOtp(job.data.to, {
					type: job.data.type,
					otp: job.data.otp,
					username: job.data.username,
					fromIp: job.data.fromIp
				});
			}
		},
		{ connection, concurrency: 5, telemetry: createBullMqTelemetry() }
	);
}
