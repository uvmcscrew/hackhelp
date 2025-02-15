import { createMutation, useQueryClient } from '@tanstack/svelte-query';
import { trpcClient } from './index.svelte';

export type BaseMutationProps = {
	onSuccess?: () => void;
};

function requestInvite(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['user_invite'],
		mutationFn: () => trpcClient.account.sendInvite.mutate(),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['user_invite'] });
		},
		onSuccess: opts?.onSuccess
	});
}

function refreshInvite(opts?: BaseMutationProps) {
	const queryClient = useQueryClient();

	return createMutation({
		mutationKey: ['user_invite'],
		mutationFn: () => trpcClient.account.refreshInvite.mutate(),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ['user_invite', 'user', 'user_status'] });
		},
		onSuccess: opts?.onSuccess
	});
}

export const mutations = {
	requestInvite,
	refreshInvite
};

export default mutations;
