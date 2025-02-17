import { t } from '../shared';
import { accountRouter, authRouter } from './account';
import { adminRouter } from './admin';
import { competitorRouter } from './competitor';

export const appRouter = t.router({
	account: accountRouter,
	auth: authRouter,
	admin: adminRouter,
	competitor: competitorRouter
});

export { updateInvitedUser } from './account';
