import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { trpcClient } from './index.svelte';
import type { RouterInputs } from '../server';
import { posthogHandler } from '$lib/utils';

export type BaseMutationProps = {
	onSuccess?: () => void;
	onError?: () => void;
};

function requestInvite(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['userInvite'],
		mutationFn: () => trpcClient.account.sendInvite.mutate(),
		onMutate: async () => {
			posthogHandler((ph) => ph.capture('Invite Requested'));
		},
		onSettled: async () =>
			await Promise.allSettled([
				queryClient.invalidateQueries({ queryKey: ['user'] }),
				queryClient.invalidateQueries({ queryKey: ['user', 'profile'] }),
				queryClient.invalidateQueries({ queryKey: ['user', 'invite'] })
			]),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

function refreshInvite(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['user refresh invite'],
		mutationFn: () => trpcClient.account.refreshInvite.mutate(),
		onMutate: async () => {
			posthogHandler((ph) => ph.capture('Invite Refreshed'));
		},
		onSettled: async () =>
			await Promise.allSettled([
				queryClient.invalidateQueries({ queryKey: ['user'] }),
				queryClient.invalidateQueries({ queryKey: ['user', 'profile'] }),
				queryClient.invalidateQueries({ queryKey: ['user', 'invite'] })
			]),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

function competitorCreateTeam(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['competitor_team'],
		mutationFn: (data: RouterInputs['competitor']['team']['create']) =>
			trpcClient.competitor.team.create.mutate(data),
		onMutate: async () => {
			posthogHandler((ph) => ph.capture('Competitor: Team Create Requested'));
		},
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ['createTeam'] }),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

function competitorJoinTeam(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['joinTeam'],
		mutationFn: (data: RouterInputs['competitor']['team']['joinTeam']) =>
			trpcClient.competitor.team.joinTeam.mutate(data),
		onMutate: async () => {
			posthogHandler((ph) => ph.capture('Competitor: Team Join Requested'));
		},
		onSettled: async () =>
			await Promise.allSettled([
				queryClient.invalidateQueries({ queryKey: ['user'] }),
				queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
			]),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

function competitorLeaveTeam(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['competitor_team'],
		mutationFn: () => trpcClient.competitor.team.leaveTeam.mutate(),
		onMutate: async () => {
			posthogHandler((ph) => ph.capture('Competitor: Team Leave Requested'));
		},
		onSettled: async () =>
			await Promise.allSettled([
				queryClient.invalidateQueries({ queryKey: ['user'] }),
				queryClient.invalidateQueries({ queryKey: ['user', 'profile'] }),
				queryClient.invalidateQueries({ queryKey: ['team'] })
			]),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

function createTeamRepo(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['create repo'],
		mutationFn: (data: RouterInputs['competitor']['repositories']['create']) =>
			trpcClient.competitor.repositories.create.mutate(data),
		onMutate: async () => {
			posthogHandler((ph) => ph.capture('Team: Repo Created'));
		},
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ['repositories'] }),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

function competitorUpdateTeamJoinable(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['change team joinable'],
		mutationFn: (data: RouterInputs['competitor']['team']['updateJoinable']) =>
			trpcClient.competitor.team.updateJoinable.mutate(data),
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ['team'] }),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

function competitorCreateTicket(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['create ticket'],
		mutationFn: (data: RouterInputs['competitor']['tickets']['create']) =>
			trpcClient.competitor.tickets.create.mutate(data),
		onMutate: async () => {
			posthogHandler((ph) => ph.capture('Ticket Created'));
		},
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ['tickets'] }),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

function adminSelfAssignTicket(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['admin self assign ticket'],
		mutationFn: (data: RouterInputs['admin']['tickets']['selfAssign']) =>
			trpcClient.admin.tickets.selfAssign.mutate(data),
		onSettled: async (data) =>
			await Promise.allSettled([
				queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] }),
				queryClient.invalidateQueries({ queryKey: ['admin', 'mytickets'] }),
				data &&
					data?.ticket &&
					queryClient.invalidateQueries({ queryKey: ['admin', 'ticket', data.ticket.id] })
			]),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

function adminAssignTicket(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['admin self assign ticket'],
		mutationFn: (data: RouterInputs['admin']['tickets']['assignTo']) =>
			trpcClient.admin.tickets.assignTo.mutate(data),
		onSettled: async (data) =>
			await Promise.allSettled([
				queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] }),
				queryClient.invalidateQueries({ queryKey: ['admin', 'mytickets'] }),
				data &&
					data?.ticket &&
					queryClient.invalidateQueries({ queryKey: ['admin', 'ticket', data.ticket.id] })
			]),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

function adminUnassignTicket(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['admin unassign ticket'],
		mutationFn: (data: RouterInputs['admin']['tickets']['unassign']) =>
			trpcClient.admin.tickets.unassign.mutate(data),
		onSettled: async (data) =>
			await Promise.allSettled([
				queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] }),
				queryClient.invalidateQueries({ queryKey: ['admin', 'mytickets'] }),
				data &&
					data?.ticket &&
					queryClient.invalidateQueries({ queryKey: ['admin', 'ticket', data.ticket.id] })
			]),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

function adminDeleteTicket(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['admin delete ticket'],
		mutationFn: (data: RouterInputs['admin']['tickets']['deleteTicket']) =>
			trpcClient.admin.tickets.deleteTicket.mutate(data),
		onSettled: async (data) =>
			await Promise.allSettled([
				queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] }),
				queryClient.invalidateQueries({ queryKey: ['admin', 'mytickets'] }),
				data &&
					data?.ticket &&
					queryClient.cancelQueries({ queryKey: ['admin', 'ticket', data.ticket.id] })
			]),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

function adminChangeTicketStatus(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['admin change ticket status'],
		mutationFn: (data: RouterInputs['admin']['tickets']['updateTicketStatus']) =>
			trpcClient.admin.tickets.updateTicketStatus.mutate(data),
		onSettled: async (data) =>
			await Promise.allSettled([
				queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] }),
				queryClient.invalidateQueries({ queryKey: ['admin', 'mytickets'] }),
				data &&
					data?.ticket &&
					queryClient.cancelQueries({ queryKey: ['admin', 'ticket', data.ticket.id] })
			]),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

function competitorUpdateTeam(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['competitor_team'],
		mutationFn: (data: RouterInputs['competitor']['team']['updateProperties']) =>
			trpcClient.competitor.team.updateProperties.mutate(data),
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ['team'] }),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

export const mutations = {
	requestInvite,
	refreshInvite,
	competitorCreateTeam,
	competitorJoinTeam,
	competitorLeaveTeam,
	createTeamRepo,
	competitorUpdateTeamJoinable,
	competitorCreateTicket,
	adminSelfAssignTicket,
	adminDeleteTicket,
	adminAssignTicket,
	adminUnassignTicket,
	adminChangeTicketStatus,
	competitorUpdateTeam
};

export default mutations;
