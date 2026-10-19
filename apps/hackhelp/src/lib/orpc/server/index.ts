import type { InferRouterInputs, InferRouterOutputs } from '@orpc/server';
import { appRouter } from './router';

export type AppRouter = typeof appRouter;

export type RouterInputs = InferRouterInputs<AppRouter>;

export type RouterOutputs = InferRouterOutputs<AppRouter>;
