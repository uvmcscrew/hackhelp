<script lang="ts">
	import { authClient } from '$lib/auth/client.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { accountsQueryOptions } from './accounts';

	let accountQuery = createQuery(() => accountsQueryOptions);

	let githubAccount = $derived.by(() => {
		let providerAccounts = accountQuery.data
			? accountQuery.data.filter((acc) => acc.providerId === 'github')
			: [];
		return providerAccounts.length === 0 ? null : providerAccounts[0];
	});

	let linkMutation = createMutation(() => ({
		mutationKey: ['auth', 'accounts', 'github'],
		// TODO Figure out which GitHub OAuth scopes are required to auto-accept org invites on behalf of the user
		mutationFn: () => authClient.linkSocial({ provider: 'github' }),
		onSettled: (_d, _e, _v, _r, ctx) =>
			ctx.client.invalidateQueries({ queryKey: accountsQueryOptions.queryKey })
	}));
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>GitHub</Card.Title>
		<Card.Description
			>Link your GitHub account to gain access to programming resources.</Card.Description
		>
	</Card.Header>
	{#if accountQuery.status === 'success'}
		{#if githubAccount}
			<Card.Content>Yippee!</Card.Content>
		{:else}
			<Card.Content>
				<Button disabled={linkMutation.isPending}>
					{#if linkMutation.isPending}
						<LoaderCircle class="h-6 w-auto animate-spin" />
					{/if}
					Link Account</Button
				>
			</Card.Content>
		{/if}
	{:else}
		<Card.Content class="text-muted-foreground italic">Loading</Card.Content>
	{/if}
</Card.Root>
