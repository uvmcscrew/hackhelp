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

	let canInitializeProfileQuery = createQuery(orpc.account.profile.canInitialize.queryOptions);

	const initializeProfileMutation = createMutation(() =>
		orpc.account.profile.initialize.mutationOptions({
			onSuccess: async () => {
				await qc.invalidateQueries({ queryKey: orpc.account.profile.get.queryKey() });
			}
		})
	);

	let roles = $derived((sessionQuery.data?.user.role ?? '').split(','));

	let initializeButtons = $derived.by(() => {
		if (roles.includes('admin')) {
			return ['admin'];
		}

		let btnRoles = [];

		if (roles.includes('mentor')) {
			btnRoles.push('mentor');
		}

		if (roles.includes('judge')) {
			btnRoles.push('judge');
		}

		if (btnRoles.length > 0) return btnRoles;

		if (roles.includes('verifiedUser') || canInitializeProfileQuery.data) {
			return ['competitor'];
		}

		return [];
	});
</script>

<CardContent class="flex gap-x-2">
	{#each initializeButtons as btn (btn)}
		{@const buttonTitle = capitalize(btn === 'admin' ? 'Organizer' : btn)}
		<Button
			onclick={async () =>
				await initializeProfileMutation.mutateAsync({
					primaryRole: btn as 'competitor' | 'mentor' | 'judge' | 'admin'
				})}
			disabled={initializeProfileMutation.isPending}
			aria-disabled={initializeProfileMutation.isPending}
			>{#if initializeProfileMutation.isPending}
				<LoaderCircle class="h-6 w-auto animate-spin" />
			{/if}Participate as {buttonTitle}</Button
		>
	{/each}
</CardContent>
