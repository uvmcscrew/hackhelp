import { Events, MessageFlags, type Client, type Interaction } from 'discord.js';
import { commands } from '../commands';
import type { BotContext } from '../types';

/**
 * Central interaction router. Currently only chat input (slash) commands are
 * handled; modals, buttons, and select menus can be routed from here too by
 * checking the other `interaction.is*()` guards.
 */
export function registerInteractionCreateEvent(client: Client, context: BotContext): void {
	client.on(Events.InteractionCreate, (interaction) => {
		void handleInteraction(interaction, context);
	});
}

async function handleInteraction(interaction: Interaction, context: BotContext): Promise<void> {
	if (!interaction.isChatInputCommand()) return;

	const command = commands.find((candidate) => candidate.data.name === interaction.commandName);
	if (!command) {
		await interaction.reply({
			content: `Unknown command: \`${interaction.commandName}\``,
			flags: MessageFlags.Ephemeral
		});
		return;
	}

	try {
		await command.execute(interaction, context);
	} catch (error) {
		console.error(`[hackbot] command \`${interaction.commandName}\` failed:`, error);
		const payload = {
			content: 'Something went wrong while running that command.',
			flags: MessageFlags.Ephemeral
		} as const;
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(payload);
		} else {
			await interaction.reply(payload);
		}
	}
}
