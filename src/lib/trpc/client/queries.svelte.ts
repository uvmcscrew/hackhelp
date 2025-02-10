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
		queryKey: ['user', 'user_status'],
		queryFn: () => trpcClient.account.getWithStatus.query(),
		initialData: initialData
	});
}

function hasPendingInvite() {
	return createQuery({
		queryKey: ['user_invite', 'user'],
		queryFn: () => trpcClient.account.hasPendingInvite.query()
	});
}

export const queries = {
	getAccount,
	getAccountWithStatus,
	hasPendingInvite
};

export default queries;
