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

function queryWhoamiWithProfile(initialData: RouterOutputs['account']['whoamiWithProfile']) {
	return createQuery({
		queryKey: ['user', 'profile'],
		queryFn: () => trpcClient.account.whoamiWithProfile.query(),
		initialData: initialData
	});
}

function hasPendingInvite() {
	return createQuery({
		queryKey: ['user', 'invite'],
		queryFn: () => trpcClient.account.hasPendingInvite.query(),
		refetchOnWindowFocus: false
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

function competitorGetMyTeam(initialData?: RouterOutputs['competitor']['team']['get']) {
	return createQuery({
		queryKey: ['team'],
		queryFn: () => trpcClient.competitor.team.get.query(),
		initialData
	});
}

function competitorCheckRepoSlug(slug: string, enabled: boolean = true) {
	return createQuery({
		queryKey: ['repo', slug],
		queryFn: () => trpcClient.competitor.repositories.repoSlugIsTaken.query({ repoName: slug }),
		refetchOnWindowFocus: false,
		enabled: !!slug && slug.length > 0 && enabled
	});
}

function competitorGetTeamRepos(
	initialData?: RouterOutputs['competitor']['repositories']['getAll']
) {
	return createQuery({
		queryKey: ['repositories'],
		queryFn: () => trpcClient.competitor.repositories.getAll.query(),
		initialData
	});
}

function competitorGetAllTeamIssues(
	initialData?: RouterOutputs['competitor']['tickets']['getAllTeamIssues']
) {
	return createQuery({
		queryKey: ['issues'],
		queryFn: () => trpcClient.competitor.tickets.getAllTeamIssues.query(),
		initialData
	});
}

function competitorGetOpenTickets(
	initialData?: RouterOutputs['competitor']['tickets']['getTickets']
) {
	return createQuery({
		queryKey: ['tickets'],
		queryFn: () => trpcClient.competitor.tickets.getTickets.query(),
		initialData
	});
}

function adminGetAllOpenTickets() {
	return createQuery({
		queryKey: ['admin', 'tickets'],
		queryFn: () => trpcClient.admin.tickets.openTickets.query(),
		refetchInterval: 30_000
	});
}

function adminGetMyAssignedTickets() {
	return createQuery({
		queryKey: ['admin', 'mytickets'],
		queryFn: () => trpcClient.admin.tickets.myTickets.query(),
		refetchInterval: 30_000
	});
}

export const queries = {
	queryWhoami,
	queryWhoamiWithProfile,
	hasPendingInvite,
	adminListAllUsers,
	adminGetUserById,
	adminGetUserByUsername,
	adminGetAllTeams,
	adminGetTeamById,
	competitorGetMyTeam,
	competitorCheckRepoSlug,
	competitorGetTeamRepos,
	competitorGetAllTeamIssues,
	competitorGetOpenTickets,
	adminGetAllOpenTickets,
	adminGetMyAssignedTickets
};

export default queries;
