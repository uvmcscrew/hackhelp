import { createQuery } from '@tanstack/svelte-query';
import { trpcClient } from './index.svelte';
import type { RouterOutputs } from '../server';

export function getAccount(initialData?: RouterOutputs['account']['get']) {
	return createQuery({
		queryKey: ['user'],
		queryFn: () => trpcClient.account.get.query(),
		initialData: initialData
	});
}

export function getAccountWithStatus(initialData: RouterOutputs['account']['getWithStatus']) {
	return createQuery({
		queryKey: ['user', 'userStatus'],
		queryFn: async () => trpcClient.account.getWithStatus.query(),
		initialData: initialData
	});
}

export const queries = {
	getAccountWithStatus
};
