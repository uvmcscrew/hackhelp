import { initTRPC } from '@trpc/server';
import type { Context } from './context';
import { ZodError } from 'zod';
import superjson from 'superjson';
export const t = initTRPC.context<Context>().create({
	transformer: superjson,

	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError: error.cause instanceof ZodError ? error.cause.flatten() : null
			}
		};
	}
});
