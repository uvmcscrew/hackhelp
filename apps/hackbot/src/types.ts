import type { Db } from '@hackhelp/db';
import type { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

/**
 * Shared services handed to every command handler. Extend this as the bot
 * grows (email client, queue publisher, etc.).
 */
export type BotContext = {
	db: Db;
};

/**
 * A slash command definition. `data` is used to register the command with
 * Discord; `execute` runs when a user invokes it.
 */
export type Command = {
	data: SlashCommandBuilder;
	execute: (interaction: ChatInputCommandInteraction, context: BotContext) => Promise<void>;
};
