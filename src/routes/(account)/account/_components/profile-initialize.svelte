<script lang="ts">
	import { sessionQueryOptions } from '$lib/auth/client.svelte';
	import { Button } from '$lib/components/ui/button';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { capitalize } from 'es-toolkit/string';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';

	const qc = useQueryClient();

	const sessionQuery = createQuery(() => sessionQueryOptions);

	const initializeProfileMutation = createMutation(() =>
		orpc.account.profile.initialize.mutationOptions({
			onSuccess: async () => {
				await qc.invalidateQueries({ queryKey: orpc.account.profile.get.queryKey() });
			}
		})
	);

	const roles = $derived((sessionQuery.data?.user.role ?? '').split(','));

	const roleButtons = $derived(
		roles
			.filter(
				(r) =>
					![
						'user',
						// Don't show competitor initialize button if user has mentor, judge, or admin roles
						(roles.includes('mentor') || roles.includes('judge') || roles.includes('admin')) &&
							'verifiedUser',

						roles.includes('admin') && 'judge',
						roles.includes('admin') && 'mentor'
					].includes(r)
			)
			.map((r) => (r.toLowerCase() === 'verifieduser' ? 'competitor' : r))
	);
</script>

<CardContent class="flex gap-x-2">
	{#each roleButtons as rb (rb)}
		{@const buttonTitle = capitalize(rb === 'admin' ? 'Organizer' : rb)}
		<Button
			onclick={async () =>
				await initializeProfileMutation.mutateAsync({
					primaryRole: rb as 'competitor' | 'mentor' | 'judge' | 'admin'
				})}
			disabled={initializeProfileMutation.isPending}
			aria-disabled={initializeProfileMutation.isPending}
			>{#if initializeProfileMutation.isPending}
				<LoaderCircle class="h-6 w-auto animate-spin" />
			{/if}Participate as {buttonTitle}</Button
		>
	{/each}
</CardContent>
