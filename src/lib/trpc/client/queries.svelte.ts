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
		initialData
	});
}

function adminGetUserById(
	userId: string,
	initialData?: RouterOutputs['admin']['users']['getById']
) {
	return createQuery({
		queryKey: ['admin', 'user', userId],
		queryFn: () => trpcClient.admin.users.getById.query({ userId }),
		initialData
	});
}

function adminGetUserByUsername(
	userName: string,
	initialData?: RouterOutputs['admin']['users']['getByUsername']
) {
	return createQuery({
		queryKey: ['admin', 'user', userName],
		queryFn: () => trpcClient.admin.users.getByUsername.query({ userName }),
		initialData
	});
}

function adminGetAllTeams(initialData?: RouterOutputs['admin']['teams']['all']) {
	return createQuery({
		queryKey: ['admin', 'teamlist'],
		queryFn: () => trpcClient.admin.teams.all.query(),
		initialData
	});
}

function adminGetTeamById(
	teamId: string,
	initialData?: RouterOutputs['admin']['teams']['getById']
) {
	return createQuery({
		queryKey: ['admin', 'team', teamId],
		queryFn: () => trpcClient.admin.teams.getById.query({ teamId }),
		initialData
	});
}

export const queries = {
	queryWhoami,
	queryWhoamiWithStatus,
	hasPendingInvite,
	adminListAllUsers,
	adminGetUserById,
	adminGetUserByUsername,
	adminGetAllTeams,
	adminGetTeamById
};

export default queries;
