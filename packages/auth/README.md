# @hackhelp/auth

This package owns the better-auth server configuration and the access-control
permissions used by the HackHelp API and client.

## Contents

- `src/index.ts` — the `createAuth({ db, env, email })` factory. It is
  environment- and SvelteKit-agnostic: the app (`apps/hackhelp`) instantiates it
  with values from `$app/env/private` and the email client from
  `@hackhelp/emails`.
- `src/permissions.ts` — access control (`createAccessControl`) statements,
  roles, and the `addRole`/`removeRole` helpers. The app re-exports everything
  from `@hackhelp/auth/permissions` so both the better-auth client and the oRPC
  routers keep importing from `#lib/auth/permissions`.
- `src/cli.ts` — a SvelteKit-free entry point for the
  `@better-auth/cli` schema generator. It builds the same auth config from
  `process.env` (bun loads the repo-root `.env` automatically) and stubs the
  email handlers, since generating the schema never sends email.

## Regenerating the auth database schema

The drizzle tables for better-auth live in `packages/db/src/auth.ts`. They are
**generated**, because their shape depends on the plugins and
`additionalFields` configured in `createAuth`. Whenever you change the auth
configuration — enabling/disabling a plugin, adding an `additionalFields`
entry, or upgrading better-auth — regenerate them:

```sh
# from the repository root
bun auth:generate
```

This runs:

```sh
bunx @better-auth/cli generate --config packages/auth/src/cli.ts --output packages/db/src/auth.ts
```

(Inside `packages/auth`, `bun run auth:generate` uses package-relative paths.)
Bun loads `.env` from the repository root, so `DATABASE_URL`, `AUTH_SECRET`,
and the OAuth credentials are available to the CLI. If `AUTH_SECRET` is
unset, the CLI falls back to a placeholder — that is fine, it only affects the
generated file, never runtime secrets.

The generator reflects the plugin set (`passkey`, `emailOTP`, `magicLink`,
`admin`, `genericOAuth`, `username`, `lastLoginMethod`) and the `teamId`
additional user field into drizzle table definitions.

### Follow-up: migrations

`packages/db/src/schema.ts` imports and re-exports everything from
`auth.ts`, so regenerating one means the drizzle diff picks the other up:

```sh
# from the repository root
bun db:gen        # create a migration for the schema diff
bun db:push       # ... or push directly in local dev
bun db:migrate    # production applies migrations via Railway pre-deploy
```

Commit both `packages/db/src/auth.ts` and the new file(s) under
`packages/db/drizzle/` together with the config change.

### Checklist when changing auth config

1. Edit the plugin / `additionalFields` / provider configuration in
   `packages/auth/src/index.ts` (or `apps/hackhelp/src/lib/auth/server.server.ts`
   for wiring-only changes).
2. `bun auth:generate`
3. `bun db:gen` (and review the generated SQL under `packages/db/drizzle/`)
4. `bun run check` to verify types still line up
5. Commit everything together
