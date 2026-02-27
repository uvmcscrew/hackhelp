import db from '$lib/server/db';
import { eq } from 'drizzle-orm';
import superjson from 'superjson';
import {
	eventTimingConfigSchema,
	participantsConfigSchema,
	challengeConfigSchema,
	type EventTimingConfig,
	type ParticipantConfig,
	type ChallengeConfig
} from './schemas';
import { building } from '$app/environment';

class Configuration {
	private db: typeof db;

	private EVENT_TIMING_KEY = 'eventTiming';
	private PARTICIPANT_CONFIG_KEY = 'participants';
	private CHALLENGE_CONFIG_KEY = 'challenges';

	constructor(dbInstance: typeof db) {
		this.db = dbInstance;
	}

	async ensureConfigs(): Promise<void> {
		const eventTiming = await this.getKeyValue<EventTimingConfig>(this.EVENT_TIMING_KEY);
		if (!eventTiming) {
			await this.setKeyValue<EventTimingConfig>(
				this.EVENT_TIMING_KEY,
				await eventTimingConfigSchema.parseAsync({})
			);
		}

		const participantConfig = await this.getKeyValue<ParticipantConfig>(
			this.PARTICIPANT_CONFIG_KEY
		);
		if (!participantConfig) {
			await this.setKeyValue(
				this.PARTICIPANT_CONFIG_KEY,
				await participantsConfigSchema.parseAsync({})
			);
		}

		const challengeConfig = await this.getKeyValue(this.CHALLENGE_CONFIG_KEY);
		if (!challengeConfig) {
			await this.setKeyValue(this.CHALLENGE_CONFIG_KEY, await challengeConfigSchema.parseAsync({}));
		}
	}

	private async getKeyValue<T>(key: string): Promise<{ data: T; lastUpdated: Date } | null> {
		const result = await this.db.client
			.select()
			.from(this.db.schema.configuration)
			.where(eq(this.db.schema.configuration.key, key))
			.limit(1);

		if (result.length === 0) {
			return null;
		}

		const value = result[0].value;
		return {
			data: superjson.deserialize<T>(value),
			lastUpdated: result[0].lastUpdated
		};
	}

	private async setKeyValue<T>(key: string, value: T): Promise<void> {
		// This contains both the `json` and `meta` fields required by superjson for later deserialization
		const serializedValue = superjson.serialize(value);

		const existing = await this.getKeyValue<T>(key);
		if (existing === null) {
			await this.db.client
				.insert(this.db.schema.configuration)
				.values({ key, value: serializedValue, lastUpdated: new Date() });
		} else {
			await this.db.client
				.update(this.db.schema.configuration)
				.set({ value: serializedValue, lastUpdated: new Date() })
				.where(eq(this.db.schema.configuration.key, key));
		}
	}

	async getEventTiming() {
		const data = await eventTimingConfigSchema.parseAsync(
			await this.getKeyValue<EventTimingConfig>(this.EVENT_TIMING_KEY)
		);
		return data;
	}

	async getParticipantConfig() {
		const data = await participantsConfigSchema.parseAsync(
			await this.getKeyValue<ParticipantConfig>(this.PARTICIPANT_CONFIG_KEY)
		);
		return data;
	}

	async getChallengeConfig() {
		const data = await challengeConfigSchema.parseAsync(
			await this.getKeyValue<ChallengeConfig>(this.CHALLENGE_CONFIG_KEY)
		);
		return data;
	}

	async setEventTiming(config: EventTimingConfig): Promise<void> {
		await this.setKeyValue<EventTimingConfig>(this.EVENT_TIMING_KEY, config);
	}

	async setChallengeConfig(config: ChallengeConfig): Promise<void> {
		await this.setKeyValue<ChallengeConfig>(this.CHALLENGE_CONFIG_KEY, config);
	}

	async setParticipantConfig(config: ParticipantConfig): Promise<void> {
		await this.setKeyValue<ParticipantConfig>(this.PARTICIPANT_CONFIG_KEY, config);
	}

	async getEventStartTime(): Promise<Date> {
		const result = await this.getEventTiming();
		return result.eventStart;
	}

	async getEventPrepTime(): Promise<Date> {
		const result = await this.getEventTiming();
		return result.eventPrep;
	}
}

export const configurationService = new Configuration(db);
if (!building) await configurationService.ensureConfigs();
