import { getQueue } from './dispatch';

export async function checkRedisConnection(): Promise<boolean> {
	const queue = getQueue('emails');
	const client = await queue.backend.client;
	return client.status === 'ready';
}
