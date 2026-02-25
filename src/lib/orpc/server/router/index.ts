import { accountRouter } from './account';
import { adminRouter } from './admin';
import { competitorRouter } from './competitor';
import { configRouter } from './configuration';
import { teamsRouter } from './teams';

export const appRouter = {
	account: accountRouter,
	admin: adminRouter,
	competitor: competitorRouter,
	config: configRouter,
	teams: teamsRouter
};
