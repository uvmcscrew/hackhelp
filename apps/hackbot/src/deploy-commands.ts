import { REST, Routes } from 'discord.js';
import { commands } from './commands';
import { env } from './env';

/**
 * Registers all commands with Discord for the configured guild. The bot is
 * single-tenant, so commands are always deployed as guild commands, which
 * register instantly (global commands can take up to an hour to propagate).
 */
export async function deployCommands(): Promise<void> {
	const rest = new REST().setToken(env.DISCORD_TOKEN);
	const body = commands.map((command) => command.data.toJSON());
	await rest.put(
		Routes.applicationGuildCommands(env.DISCORD_APPLICATION_ID, env.DISCORD_GUILD_ID),
		{ body }
	);
	console.log(`[hackbot] deployed ${body.length} guild command(s)`);
}

// Allow running standalone: `bun run deploy-commands`
if (import.meta.main) {
	await deployCommands();
}
