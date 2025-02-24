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
		mutationKey: ['user_invite'],
		mutationFn: () => trpcClient.account.sendInvite.mutate(),
		onMutate: async () => {
			posthogHandler((ph) => ph.capture('Invite Requested'));
		},
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ['user_invite'] }),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

function refreshInvite(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['user_invite'],
		mutationFn: () => trpcClient.account.refreshInvite.mutate(),
		onMutate: async () => {
			posthogHandler((ph) => ph.capture('Invite Refreshed'));
		},
		onSettled: async () =>
			await queryClient.invalidateQueries({ queryKey: ['user_invite', 'user', 'user_status'] }),
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
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ['competitor_team'] }),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

function competitorJoinTeam(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['competitor_team'],
		mutationFn: (data: RouterInputs['competitor']['team']['joinTeam']) =>
			trpcClient.competitor.team.joinTeam.mutate(data),
		onMutate: async () => {
			posthogHandler((ph) => ph.capture('Competitor: Team Join Requested'));
		},
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ['competitor_team'] }),
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
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ['competitor_team'] }),
		onSuccess: opts?.onSuccess,
		onError: opts?.onError
	});
}

export const mutations = {
	requestInvite,
	refreshInvite,
	competitorCreateTeam,
	competitorJoinTeam,
	competitorLeaveTeam
};

export default mutations;
