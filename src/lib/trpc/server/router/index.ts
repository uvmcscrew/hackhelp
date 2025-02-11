import { z } from 'zod';
import { t } from '../shared';
import { accountRouter, authRouter } from './account';
import { adminRouter } from './admin';

export const appRouter = t.router({
	hello: t.procedure.input(z.string()).query((opts) => {
		return { greeting: `Hello, ${opts.input}!` };
	}),
	account: accountRouter,
	auth: authRouter,
	admin: adminRouter
});

export { updateInvitedUser } from './account';
