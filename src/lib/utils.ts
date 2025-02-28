import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import posthog, { type PostHog } from 'posthog-js';
import { browser, building, dev } from '$app/environment';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function promiseHandler<T>(promise: Promise<T>) {
	return promise
		.then((data) => ({ data, error: null }))
		.catch((err) => ({ data: null, error: err }));
}

/**
 * This function only runs posthog events on the client side and in prod. otherwise, there are errors
 * @param posthogFn a function that does a thing with posthog
 */
export function posthogHandler(posthogFn: (ph: PostHog) => void) {
	if (!building && browser && !dev) {
		posthogFn(posthog);
	}
}

export const MAX_TEAMS_PER_CHALLENGE = 6;

export const WORK_ROOMS = [
	'Kalkin 225',
	'Kalkin 110',
	'Ifshin 107 (Keller Room)',

	'Ifshin 337A',
	'Ifshin 337',
	'Ifshin 240',
	'Ifshin 358',

	'Ifshin 238A',
	'Ifshin 238B',
	'Ifshin 238C',
	'Ifshin 238E',
	'Ifshin 238F',

	'Ifshin 236A',
	'Ifshin 236B',
	'Ifshin 236C',
	'Ifshin 236D',
	'Ifshin 236E'
] as const;

export type WorkRooms = (typeof WORK_ROOMS)[number];
