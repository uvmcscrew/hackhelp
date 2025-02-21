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
