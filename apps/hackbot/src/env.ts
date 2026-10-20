import { z } from 'zod';

const envSchema = z.object({
	DISCORD_TOKEN: z.string().min(1),
	DISCORD_APPLICATION_ID: z.string().min(1),
	DISCORD_GUILD_ID: z.string().min(1),
	DATABASE_URL: z.string().min(1)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error('[hackbot] invalid environment configuration:');
	for (const issue of parsed.error.issues) {
		console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
	}
	process.exit(1);
}

export const env = parsed.data;
