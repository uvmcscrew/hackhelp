import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { trpcClient } from './index.svelte';
import type { RouterInputs } from '../server';

export type BaseMutationProps = {
	onSuccess?: () => void;
};

function requestInvite(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['user_invite'],
		mutationFn: () => trpcClient.account.sendInvite.mutate(),
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ['user_invite'] }),
		onSuccess: opts?.onSuccess
	});
}

function refreshInvite(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['user_invite'],
		mutationFn: () => trpcClient.account.refreshInvite.mutate(),
		onSettled: async () =>
			await queryClient.invalidateQueries({ queryKey: ['user_invite', 'user', 'user_status'] }),
		onSuccess: opts?.onSuccess
	});
}

function competitorCreateTeam(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['competitor_team'],
		mutationFn: (data: RouterInputs['competitor']['team']['create']) =>
			trpcClient.competitor.team.create.mutate(data),
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ['competitor_team'] }),
		onSuccess: opts?.onSuccess
	});
}

function competitorJoinTeam(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['competitor_team'],
		mutationFn: (data: RouterInputs['competitor']['team']['joinTeam']) =>
			trpcClient.competitor.team.joinTeam.mutate(data),
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: ['competitor_team'] }),
		onSuccess: opts?.onSuccess
	});
}

export const mutations = {
	requestInvite,
	refreshInvite,
	competitorCreateTeam,
	competitorJoinTeam
};

export default mutations;
