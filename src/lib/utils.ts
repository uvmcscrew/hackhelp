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
		.catch((err: unknown) => ({ data: null, error: err }));
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
	// 'Kalkin 225',
	// 'Kalkin 110',
	// 'Ifshin 107 (Keller Room)',

	'337A',
	'337B',
	'337C',
	// 'Ifshin 337',
	'358',

	'238A',
	'238B',
	'238C',
	'238E',
	'238F',
	'238G',

	' 235',
	' 237',
	'Fac.Lnge - 200',

	'240 - Mentor Room',

	'236A',
	'236B',
	'236C',
	'236D',
	'236E'
] as const;

export type WorkRooms = (typeof WORK_ROOMS)[number];
