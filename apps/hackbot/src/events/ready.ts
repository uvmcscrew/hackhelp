import { Events, type Client } from 'discord.js';

export function registerReadyEvent(client: Client): void {
	client.once(Events.ClientReady, (readyClient) => {
		console.log(`[hackbot] logged in as ${readyClient.user.tag}`);
	});
}
