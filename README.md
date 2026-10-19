# HackHelp

HackHelp is a portal created to simplify team management, GitHub permission handling, & help ticketing for teams at the 2025 UVM Hackathon.

**See more information on the repo wiki =>** https://github.com/uvmcscrew/hackhelp/wiki

## Repository layout

This is a bun workspace monorepo:

- `apps/hackhelp` — the SvelteKit application
- `packages/db` (`@hackhelp/db`) — drizzle schema, client, and migrations
- `packages/auth` (`@hackhelp/auth`) — the better-auth server config and access control
- `packages/emails` (`@hackhelp/emails`) — react-email templates and the SMTP sender

Scripts are wrapped at the repo root (`bun dev`, `bun db:gen`, `bun email:dev`,
`bun auth:generate`, ...) and delegate into the owning package. Environment
variables live in the root `.env` (see `.env.example`). Run `bun install` at
the repo root after cloning.

## Auth database schema

If you change the better-auth configuration (plugins, additional user fields,
providers), regenerate the drizzle tables: see
[packages/auth/README.md](./packages/auth/README.md#regenerating-the-auth-database-schema).

## Developers: Run it locally

### Prerequisites

- [Bun](https://bun.sh)
- A PostgreSQL database
- Github App Credentials

#### Dev Database with Docker

This project requires a vanilla (i.e. unmodified) PostgreSQL database. If you have [Docker Compose](https://docs.docker.com/compose/) (or the ability to use compose files with Podman/Orbstack/etc), you can use the compose file in this repo to spin up a development database for yourself.

The connection string with the credentials as set in the repo is `postgres://cscrew:database@localhost:32700/hackhelp`

#### Set up environment variables

See `.env.example` for all required environment variables

#### GitHub App Credentials

##### Permissions

**Repository permissions**

- Administration: Read & Write
- Contents: Read
- Issues: Read & Write

**Organization permissions**

- Administration: Read & Write
- Members: Read & Write

**Account permissions**

- Email addresses: Read

### Get Started

#### Install Dependencies

```sh
bun install
```

#### Run database migrations

```sh
bun db:migrate
```

#### Run the development server

```sh
bun dev
```

then visit http://localhost:5173

#### Analyze bundle size

```sh
bunx vite-bundle-analyzer
```

### Development Notes

#### Code Line Counting

```sh
# Counting excluding installed ui components
# see .tokeignore
tokei
# Counting everything
tokei --no-ignore
```

##### Feb 26th 2025 at 21:32

```
===============================================================================
 Language            Files        Lines         Code     Comments       Blanks
===============================================================================
 CSS                     1           78           56            0           22
 HTML                    1           12           12            0            0
 JavaScript              2           53           43            6            4
 JSON                    3          130          130            0            0
 Markdown                1          109            0           67           42
 SVG                     1           11           10            1            0
 TypeScript             41         2300         1928           86          286
-------------------------------------------------------------------------------
 Svelte                 41         1268         1208            0           60
 |- JavaScript          36          648          547            5           96
 (Total)                           1916         1755            5          156
===============================================================================
 Total                  91         3961         3387          160          414
===============================================================================
```

## Credits

- https://themes.fkaya.dev/ (theme generator)

## License

This project is licensed under the [MIT License](./LICENSE)
