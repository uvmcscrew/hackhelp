import { appRouter } from './router';
import { t } from './shared';

export type AppRouter = typeof appRouter;

export const trpcCreateCaller = t.createCallerFactory(appRouter);

// type PageLoadCaller = (caller: typeof trpcCreateCaller) => ReturnType<typeof caller.account.getWithStatus>;

// export async function trpcPageLoader((caller: typeof trpcCreateCaller)) {
//   return trpcCreateCaller(event).account.getWithStatus();
// }
