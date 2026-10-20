# hackbot

The Discord bot for the HackHelp platform. It is a **single-tenant** bot: it serves exactly one Discord guild (the hackathon's server), configured via `DISCORD_GUILD_ID`.

Built exclusively on Discord's modern interaction APIs — slash commands, modals, buttons, and select menus. No prefix commands, no message-content parsing.

## Tech Stack

| Piece           | Choice                                     | Why                                                                      |
| --------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| Runtime         | Bun                                        | Matches the rest of the monorepo                                         |
| Discord library | [discord.js](https://discord.js.org/) v14  | Mature, first-class support for all interaction types                    |
| Connection      | Gateway websocket                          | No public HTTP endpoint required; interactions arrive over the websocket |
| Database        | `@hackhelp/db` (Drizzle ORM + postgres.js) | Shared schema with the main app                                          |
| Env validation  | zod                                        | Fails fast with a readable error at boot                                 |

## Prerequisites

1. A Discord application + bot: [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. From **General Information**, copy the **Application ID** (`DISCORD_APPLICATION_ID`).
3. From **Bot**, click **Reset Token** and copy the token (`DISCORD_TOKEN`). No privileged gateway intents are required — the bot only uses the `Guilds` intent.
4. Invite the bot to your server. From **OAuth2 → URL Generator**, select the `bot` scope and the `applications.commands` scope, then open the generated URL and pick your guild. (Alternatively use `bot` + `applications.commands` permissions `0` — slash commands need no special permission flags beyond what the guild allows.)
5. Enable Developer Mode in Discord (Settings → Advanced), right-click your server, **Copy Server ID** (`DISCORD_GUILD_ID`).
6. A running Postgres — from the monorepo root: `bun run db:start` (docker compose).

## Setup

```sh
# from the monorepo root
bun install

# configure environment
cp apps/hackbot/.env.example apps/hackbot/.env
# fill in DISCORD_TOKEN, DISCORD_APPLICATION_ID, DISCORD_GUILD_ID, DATABASE_URL
```

Run the bot:

```sh
bun run dev        # watch mode (from apps/hackbot)
bun run start      # one-shot
```

On boot the bot **deploys its commands to the guild** and then connects to the gateway. Guild commands register instantly, so `/ping` is available as soon as the bot logs in. To (re)deploy commands without starting the bot:

```sh
bun run deploy-commands
```

### Environment variables

| Variable                 | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `DISCORD_TOKEN`          | Bot token from the Developer Portal                  |
| `DISCORD_APPLICATION_ID` | Application (client) ID                              |
| `DISCORD_GUILD_ID`       | The single guild the bot serves                      |
| `DATABASE_URL`           | Postgres connection string (same DB as the main app) |

## Project Structure

```
apps/hackbot/
├── index.ts                  # Entry point: wires context, events, login, shutdown
├── src/
│   ├── env.ts                # zod-validated environment
│   ├── db.ts                 # @hackhelp/db singleton (createDb(DATABASE_URL))
│   ├── client.ts             # discord.js Client factory (GatewayIntentBits.Guilds)
│   ├── types.ts              # BotContext + Command types
│   ├── deploy-commands.ts    # REST registration of guild commands
│   ├── commands/
│   │   ├── index.ts          # Command registry (array of all commands)
│   │   └── ping.ts           # Example: replies with latency + verifies DB
│   └── events/
│       ├── ready.ts          # Startup log
│       └── interactionCreate.ts  # Routes interactions to command handlers
```

## Adding a Command

1. Create `src/commands/<name>.ts`:

   ```ts
   import { SlashCommandBuilder } from 'discord.js';
   import type { Command } from '../types';

   export const example = {
   	data: new SlashCommandBuilder()
   		.setName('example')
   		.setDescription('An example command')
   		.addStringOption((option) =>
   			option.setName('input').setDescription('Some input').setRequired(true)
   		),
   	async execute(interaction, { db }) {
   		const input = interaction.options.getStringOrThrow('input');
   		// db is the Drizzle client: db.select().from(db.schema.team)...
   		await interaction.reply(`You said: ${input}`);
   	}
   } satisfies Command;
   ```

2. Add it to the registry in `src/commands/index.ts`.
3. Restart the bot (commands redeploy automatically on boot).

Handlers receive `(interaction, context)` where `context` is `BotContext` — currently `{ db }`, extend it in `src/types.ts` as the bot grows.

## Database Access

The bot uses the shared `@hackhelp/db` package, the same Drizzle schema as the main app (`user`, `team`, `ticket`, `challenge`, etc.):

```ts
import { eq } from 'drizzle-orm';

const [team] = await db.select().from(db.schema.team).where(eq(db.schema.team.id, teamId));
```

Migrations are owned by `packages/db` (`bun run db:push` / `db:migrate` from there) — the bot never mutates schema.

## Future Requirements

### Discord OAuth (user identification)

Goal: when someone uses a slash command, the bot should know which HackHelp account they are.

**No schema changes are required.** Better Auth's `account` table already stores linked OAuth identities (`providerId` + `accountId`). The plan:

1. Add Discord as an OAuth provider in `@hackhelp/auth` (via `socialProviders` or the `genericOAuth` plugin, alongside GitHub/UVM NetID/MLH). Create an OAuth2 client in the Developer Portal with a redirect URI pointing at the main app.
2. Users link their Discord account by signing in with Discord on the HackHelp web app. This writes a row: `account { providerId: 'discord', accountId: '<discord user id>', userId }`.
3. The bot resolves the invoking Discord user to a HackHelp user:

   ```ts
   const [link] = await db
   	.select()
   	.from(db.schema.account)
   	.where(
   		and(
   			eq(db.schema.account.providerId, 'discord'),
   			eq(db.schema.account.accountId, interaction.user.id)
   		)
   	);
   // link?.userId is the HackHelp user id
   ```

   A helper for this lookup (plus an "account not linked" ephemeral reply with a link to the web app) should live in `src/` and be shared by commands that need identity.

4. Add `'discord'` to `account.accountLinking.trustedProviders` in `@hackhelp/auth` if linking should merge with existing accounts.

### HTTP Server

**Not needed today.** The bot receives interactions over the gateway websocket, so it works anywhere it can make _outbound_ connections (no public URL, no ingress config).

An HTTP server would only become necessary if we:

- switch to Discord's **HTTP-based interactions** endpoint (Discord POSTs each interaction to a public URL, requires Ed25519 signature verification), or
- expose webhooks/endpoints for other services to call the bot.

If that happens, Bun's built-in `Bun.serve()` is enough — no framework needed.

### Railway Deployment & Cost

The bot is a long-running process (the gateway websocket must stay open), so it maps naturally to a Railway service:

- **Compute profile:** idle discord.js bots use roughly 100–200 MB RAM and near-zero CPU; traffic is a few small websocket frames per second at most.
- **Estimated cost:** ~$5/month on Railway's usage-based pricing (RAM is the dominant term at 24/7 uptime). This is close to what Railway's Hobby plan allowance covers, so the bot may effectively be free or a few dollars a month.
- **Gateway vs HTTP trade-off:** HTTP interactions would allow scale-to-zero serverless deployments (cheaper, pay-per-invocation), but add cold starts, a public URL, and signature verification. For a hackathon bot the always-on gateway is simpler and the cost difference is negligible.
- **Production notes:** set the four env vars in Railway, use Railway's Postgres (or the production DB URL), and rely on Railway's restart policy for crash recovery. The bot handles `SIGTERM` for clean shutdowns during redeploys.

## Scripts

| Script                    | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `bun run dev`             | Run with file watching                           |
| `bun run start`           | Run the bot                                      |
| `bun run deploy-commands` | Register guild commands without starting the bot |
| `bun run check`           | TypeScript typecheck                             |
