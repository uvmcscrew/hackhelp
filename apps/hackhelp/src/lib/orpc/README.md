# Primary API: `oRPC`

This project uses [oRPC](https://orpc.dev) (OpenAPI Remote Procedure Call) for core backend logic that's written in Typescript within SvelteKit. There are some benefits to this approach:

- Automatic shared types between frontend and backend (without codegen or manual translation)
- Integrated codebase reduces context-switching and makes maintenance easier
- No CORS policy to deal with since it's all one app
- Easier to introduce new contributors as they don't have to work on two languages at once

## The `server` directory

Shockingly, this directory contains all the code that runs on the server. This is where you write DB queries and related backend logic to provide data to the frontend.

`context.ts`

The context is passed to every oRPC middleware and handler. It contains shared utilities like database tooling and common API clients; this reduces imports and generally makes code cleaner.

`shared.ts`

Shared utilities (e.g. middleware) and setup code for oRPC

### Routers

Routers are a means of grouping procedures. The way this is typically structured is that each file in the routers folder contains multiple seperate but related routers that are combined into one larger router at the end.

Each file is responsible for some section of the app; in this case, the administrator dashboard and competitor dashboard, as well as account/login.
