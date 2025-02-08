import { z } from 'zod';
import { t } from './shared';

export const appRouter = t.router({
	hello: t.procedure.input(z.string()).query((opts) => {
		return { greeting: `Hello, ${opts.input}!` };
	})
});
// export type definition of API
export type AppRouter = typeof appRouter;
