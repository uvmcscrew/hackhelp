import { sql } from 'drizzle-orm';
import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types';

export const ping = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Check that the bot is online and the database is reachable'),
	async execute(interaction, { db }) {
		await db.execute(sql`SELECT 1`);
		const wsPing = interaction.client.ws.ping;
		await interaction.reply(`Pong! Gateway latency: ${wsPing}ms. Database connection: OK.`);
	}
} satisfies Command;
