import { accountRouter } from './account';
import { adminRouter } from './admin';
import { challengesRouter } from './challenges';
import { competitorRouter } from './competitor';
import { configRouter } from './configuration';
import { teamsRouter } from './teams';
import { ticketsRouter } from './tickets';

export const appRouter = {
	account: accountRouter,
	admin: adminRouter,
	challenges: challengesRouter,
	competitor: competitorRouter,
	config: configRouter,
	teams: teamsRouter,
	tickets: ticketsRouter
};
