import { createQuery } from '@tanstack/svelte-query';
import { trpcClient } from './index.svelte';
import type { RouterOutputs } from '../server';

function queryWhoami(initialData: RouterOutputs['account']['whoami']) {
	return createQuery({
		queryKey: ['user'],
		queryFn: () => trpcClient.account.whoami.query(),
		initialData: initialData
	});
}

function queryWhoamiWithStatus(initialData: RouterOutputs['account']['whoamiWithStatus']) {
	return createQuery({
		queryKey: ['user', 'user_status'],
		queryFn: () => trpcClient.account.whoamiWithStatus.query(),
		initialData: initialData
	});
}

function hasPendingInvite() {
	return createQuery({
		queryKey: ['user_invite', 'user'],
		queryFn: () => trpcClient.account.hasPendingInvite.query()
	});
}

function adminListAllUsers(initialData?: RouterOutputs['admin']['users']['all']) {
	return createQuery({
		queryKey: ['admin', 'userlist'],
		queryFn: () => trpcClient.admin.users.all.query(),
		initialData: initialData
	});
}

export const queries = {
	queryWhoami,
	queryWhoamiWithStatus,
	hasPendingInvite,
	adminListAllUsers
};

export default queries;
