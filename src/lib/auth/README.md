# Authentication

## Generating the database schema

SvelteKit has it's own magic for environment variables, but it doesn't work with stuff outside of sveltekit. Thus, some temporary modifications are required to automatically generate the database schema.

1. In the `createEnv` function call, comment out the lines `runtimeEnv: { ...privateEnv, ...publicEnv },` & `skipValidation: building,`. Uncomment the line that says `runtimeEnv: import.meta.env,`
2. Comment out these imports at the top of the file:

```ts
import { building } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
```

so that it becomes

```ts
// import { building } from '$app/environment';
// import { env as privateEnv } from '$env/dynamic/private';
// import { env as publicEnv } from '$env/dynamic/public';
```

3. In the root of the project, run `bun auth:db`

4. After this is complete, un-comment the imports shown above, then comment out the `runtimeEnv: import.meta.env,` and un-comment the `runtimeEnv: { ...privateEnv, ...publicEnv },` & `skipValidation: building,`.

The comment/un-comment changes above should not be committed - these changes are only temporary and should be reverted before commits are made.
