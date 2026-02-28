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

export const WHITELISTED_EMAIL_DOMAINS = [
	'uvm.edu',
	'middlebury.edu',
	'champlain.edu',
	'smcvt.edu',
	'mcgill.ca'
] as const;

export const MAX_TEAMS_PER_CHALLENGE = 6;

export const WORK_ROOMS = [
	'Innovation E102',
	'Innovation E100',
	'Innovation E105',
	'Innovation E204',
	'Innovation E210 South',
	'Innovation E210 North'
] as const;

export type WorkRooms = (typeof WORK_ROOMS)[number];
