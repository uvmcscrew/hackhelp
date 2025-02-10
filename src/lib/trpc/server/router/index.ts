import { z } from 'zod';
import { t } from '../shared';
import { accountRouter } from './account';

export const appRouter = t.router({
	hello: t.procedure.input(z.string()).query((opts) => {
		return { greeting: `Hello, ${opts.input}!` };
	}),
	account: accountRouter
});

export { updateInvitedUser } from './account';
