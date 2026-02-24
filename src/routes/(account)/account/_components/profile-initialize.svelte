<script lang="ts">
	import { authClient } from '$lib/auth/client.svelte';
	import { sessionQueryOptions } from '$lib/auth/client.svelte';
	import { Button } from '$lib/components/ui/button';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { capitalize } from 'es-toolkit/string';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { accountsQueryOptions } from '../_cards/accounts';

	const qc = useQueryClient();

	const sessionQuery = createQuery(() => sessionQueryOptions);

	const accountQuery = createQuery(() => accountsQueryOptions);

	let canInitializeProfileQuery = createQuery(orpc.account.profile.canInitialize.queryOptions);

	const initializeProfileMutation = createMutation(() =>
		orpc.account.profile.initialize.mutationOptions({
			onSuccess: async () => {
				await qc.invalidateQueries({ queryKey: orpc.account.profile.get.queryKey() });
			}
		})
	);

	const mlhLinkMutation = createMutation(() => ({
		mutationKey: ['auth', 'accounts', 'mlh', 'link'],
		mutationFn: () =>
			authClient.oauth2.link({
				providerId: 'mlh',
				callbackURL: '/account',
				errorCallbackURL: '/auth/error?provider=mlh'
			})
	}));

	let roles = $derived((sessionQuery.data?.user.role ?? '').split(','));

	// True when this user is a plain competitor candidate (no special role grants)
	const isCompetitorCandidate = $derived(
		!roles.includes('admin') && !roles.includes('mentor') && !roles.includes('judge')
	);

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

<CardContent class="flex flex-col gap-y-4">
	<div class="flex gap-x-2">
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
	</div>

	{#if isCompetitorCandidate}
		<div class="border-border border-t pt-4 text-sm">
			<p class="font-medium">Are you a student competitor?</p>
			<p class="text-muted-foreground mt-1">
				You can also link your MLH account to set up your competitor profile automatically.
			</p>
			<Button
				variant="outline"
				class="mt-2"
				onclick={async () => await mlhLinkMutation.mutateAsync()}
				disabled={mlhLinkMutation.isPending}
			>
				{#if mlhLinkMutation.isPending}
					<LoaderCircle class="h-4 w-auto animate-spin" />
				{/if}
				Link MLH account
			</Button>
		</div>
	{/if}

	{#if roles.includes('mentor') || roles.includes('judge')}
		<p class="text-muted-foreground text-sm">
			If you need to register as a different role, contact the hackathon organizers.
		</p>
	{/if}
</CardContent>
