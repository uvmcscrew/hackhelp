<script lang="ts">
	import { authClient } from '$lib/auth/client.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { accountsQueryOptions } from './accounts';

	let accountQuery = createQuery(() => accountsQueryOptions);

	let uvmNetIdAccount = $derived.by(() => {
		let providerAccounts = accountQuery.data
			? accountQuery.data.filter((acc) => acc.providerId === 'uvm-netid')
			: [];
		return providerAccounts.length === 0 ? null : providerAccounts[0];
	});

	let linkMutation = createMutation(() => ({
		mutationKey: ['auth', 'accounts', 'uvm-netid'],
		mutationFn: () => authClient.oauth2.link({ providerId: 'uvm-netid', callbackURL: '/account' }),
		onSettled: (_d, _e, _v, _r, ctx) =>
			ctx.client.invalidateQueries({ queryKey: accountsQueryOptions.queryKey })
	}));
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>UVM NetID</Card.Title>
		<Card.Description
			>Link your UVM NetID to make your account eligible for automatic verification.</Card.Description
		>
	</Card.Header>
	{#if accountQuery.status === 'success'}
		{#if uvmNetIdAccount}
			<Card.Content>
				Account ID: {uvmNetIdAccount.accountId}
			</Card.Content>
		{:else}
			<Card.Content>
				<Button
					onclick={async () => await linkMutation.mutateAsync()}
					disabled={linkMutation.isPending}
				>
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
