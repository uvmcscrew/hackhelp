import { createBotClient } from './src/client';
import { commands } from './src/commands';
import { db } from './src/db';
import { deployCommands } from './src/deploy-commands';
import { env } from './src/env';
import { registerInteractionCreateEvent } from './src/events/interactionCreate';
import { registerReadyEvent } from './src/events/ready';
import type { BotContext } from './src/types';

const context: BotContext = { db };
const client = createBotClient();

registerReadyEvent(client);
registerInteractionCreateEvent(client, context);

// Keep Discord's command list in sync with the codebase on every boot.
await deployCommands();
await client.login(env.DISCORD_TOKEN);

console.log(`[hackbot] running ${commands.length} command(s) in guild ${env.DISCORD_GUILD_ID}`);

let closing = false;
async function shutdown(signal: string): Promise<void> {
	if (closing) return;
	closing = true;
	console.log(`[hackbot] ${signal} received, shutting down...`);
	await client.destroy();
	process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
