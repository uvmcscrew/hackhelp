import { accountRouter, authRouter } from './account';
import { adminRouter } from './admin';
import { competitorRouter } from './competitor';

export const appRouter = {
	account: accountRouter,
	auth: authRouter,
	admin: adminRouter,
	competitor: competitorRouter
};

export { updateInvitedUser } from './account';
