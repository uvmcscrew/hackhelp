import z from 'zod';

export const eventTimingConfigSchema = z.object({
	eventPrep: z.date().default(new Date('2026-02-25T00:00:00.000Z')),
	eventStart: z.date().default(new Date('2026-02-28T13:30:00.000Z')),
	competitionStart: z.date().default(new Date('2026-02-28T14:00:00.000Z')),
	competitionEnd: z.date().default(new Date('2026-02-28T22:00:00.000Z')),
	registrationDeadline: z.date().default(new Date('2026-02-26T04:59:59.000Z'))
});

export type EventTimingConfig = z.infer<typeof eventTimingConfigSchema>;

export const participantsConfigSchema = z.object({
	maxParticipants: z.number().min(1).default(100),
	teamSizeMin: z.number().min(1).default(4),
	teamSizeMax: z.number().min(1).default(6)
});

export type ParticipantConfig = z.infer<typeof participantsConfigSchema>;

export const challengeConfigSchema = z.object({
	challengesViewAvailableNow: z.boolean().default(false),
	challengesViewAvailableFrom: z.date().default(new Date('2026-02-28T13:45:00.000Z')),
	challengesRegisterAvailableNow: z.boolean().default(false),
	challengesRegisterAvailableFrom: z.date().default(new Date('2026-02-28T14:00:00.000Z')),
	maxTeamsPerChallenge: z.number().min(1).default(10)
});

export type ChallengeConfig = z.infer<typeof challengeConfigSchema>;
