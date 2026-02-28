import { dev } from '$app/environment';
import { checkRolePermission } from '$lib/auth/permissions';
import {
	eventTimingConfigSchema,
	challengeConfigSchema,
	participantsConfigSchema,
	githubConfigSchema
} from '$lib/server/config/schemas';
import { o, protectedProcedure, publicProcedure } from '../shared';
import { ORPCError } from '@orpc/server';

const enforceConfigViewPermission = o.middleware(({ context, next }) => {
	if (!context.user) {
		throw new ORPCError('UNAUTHORIZED', { cause: 'You are not logged in' });
	}

	if (
		!checkRolePermission({
			roles: context.user.role || '',
			permissions: {
				configuration: ['view']
			}
		})
	) {
		throw new ORPCError('FORBIDDEN', {
			cause: 'You do not have permission to view configurations'
		});
	}

	return next({
		context: {
			user: context.user,
			session: context.session
		}
	});
});

const enforceConfigEditPermission = o.middleware(({ context, next }) => {
	if (!context.user) {
		throw new ORPCError('UNAUTHORIZED', { cause: 'You are not logged in' });
	}

	if (
		!checkRolePermission({
			roles: context.user.role || '',
			permissions: {
				configuration: ['update', 'delete']
			}
		})
	) {
		throw new ORPCError('FORBIDDEN', {
			cause: 'You do not have permission to view configurations'
		});
	}

	return next({
		context: {
			user: context.user,
			session: context.session
		}
	});
});

const configViewProcedure = o.use(enforceConfigViewPermission);
const configEditProcedure = o.use(enforceConfigEditPermission);

export const configRouter = {
	// Configuration snippets available to unauthenticated users or users who are not otherwise allowed to view configuration
	viewPublic: {
		eventStartTime: publicProcedure.handler(async ({ context }) => {
			const eventStartTime = await context.config.getEventStartTime();
			return eventStartTime;
		}),
		hasEventStarted: publicProcedure.handler(async ({ context }) => {
			const eventStartTime = await context.config.getEventStartTime();
			return new Date() >= eventStartTime;
		}),
		allowAccessToEventPages: protectedProcedure.handler(async ({ context }) => {
			// Always allow access in dev mode
			if (dev) return true;

			// Always allow access for admins
			if (context.user.role?.split(',').includes('admin')) return true;

			// Allow access once the event prep period begins
			const eventPrepTime = await context.config.getEventPrepTime();

			return new Date() >= eventPrepTime;
		}),
		allowAccessToTicketPages: protectedProcedure.handler(async ({ context }) => {
			// Always allow access in dev mode
			if (dev) return true;

			// Always allow access for admins
			if (context.user.role?.split(',').includes('admin')) return true;

			// Allow access once the event prep period begins
			const eventPrepTime = await context.config.getEventStartTime();

			return new Date() >= eventPrepTime;
		})
	},
	view: {
		eventTiming: configViewProcedure.handler(async ({ context }) => {
			const eventTiming = await context.config.getEventTiming();
			return eventTiming;
		}),
		participants: configViewProcedure.handler(async ({ context }) => {
			const participantConfig = await context.config.getParticipantConfig();
			return participantConfig;
		}),
		challenges: configViewProcedure.handler(async ({ context }) => {
			const challengeConfig = await context.config.getChallengeConfig();
			return challengeConfig;
		}),
		github: configViewProcedure.handler(async ({ context }) => {
			const githubConfig = await context.config.getGithubConfig();
			return githubConfig;
		})
	},
	update: {
		eventTiming: configEditProcedure
			.input(eventTimingConfigSchema)
			.handler(async ({ context, input }) => {
				await context.config.setEventTiming(input);
			}),
		challenges: configEditProcedure
			.input(challengeConfigSchema)
			.handler(async ({ context, input }) => {
				await context.config.setChallengeConfig(input);
			}),
		participants: configEditProcedure
			.input(participantsConfigSchema)
			.handler(async ({ context, input }) => {
				await context.config.setParticipantConfig(input);
			}),
		github: configEditProcedure.input(githubConfigSchema).handler(async ({ context, input }) => {
			await context.config.setGithubConfig(input);
		})
	}
};
