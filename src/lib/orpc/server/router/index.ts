import { accountRouter } from './account';
import { adminRouter } from './admin';
import { competitorRouter } from './competitor';
import { configRouter } from './configuration';

export const appRouter = {
	account: accountRouter,
	admin: adminRouter,
	competitor: competitorRouter,
	config: configRouter
};
