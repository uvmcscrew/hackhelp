import { createQuery } from '@tanstack/svelte-query';
import { trpcClient } from './index.svelte';
import type { RouterOutputs } from '../server';

function getAccount(initialData: RouterOutputs['account']['get']) {
	return createQuery({
		queryKey: ['user'],
		queryFn: () => trpcClient.account.get.query(),
		initialData: initialData
	});
}

function getAccountWithStatus(initialData: RouterOutputs['account']['getWithStatus']) {
	return createQuery({
		queryKey: ['user', 'userStatus'],
		queryFn: async () => trpcClient.account.getWithStatus.query(),
		initialData: initialData
	});
}

export const queries = {
	getAccount,
	getAccountWithStatus
};

export default queries;
