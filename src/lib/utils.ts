import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
