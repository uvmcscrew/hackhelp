import { Client, GatewayIntentBits } from 'discord.js';

/**
 * Creates the Discord client. `Guilds` is the only intent required for slash
 * commands; add more intents here if the bot ever needs message content,
 * members, presence, etc.
 */
export function createBotClient(): Client {
	return new Client({
		intents: [GatewayIntentBits.Guilds]
	});
}
