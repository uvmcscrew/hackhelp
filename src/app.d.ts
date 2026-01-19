// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			auth: AuthLocals;
		}
	}
}

type AuthLocals =
	| {
			user: import('$lib/auth/server').User;
			session: import('$lib/auth/server').Session;
	  }
	| {
			user: null;
			session: null;
	  };

export {};
