<script lang="ts">
	import { authClient } from '$lib/auth/client.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { accountsQueryOptions } from './accounts';
	import { Confetti } from 'svelte-confetti';
	import type { UserAccounts } from '$lib/auth/server.server';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import WarningAlert from '$lib/components/warning-alert.svelte';

	type Props = {
		initialData: {
			accounts: UserAccounts;
		};
	};

	let { initialData }: Props = $props();

	let accountQuery = createQuery(() => ({
		...accountsQueryOptions,
		initialData: initialData.accounts
	}));

	let uvmNetIdAccount = $derived.by(() => {
		let providerAccounts = accountQuery.data
			? accountQuery.data.filter((acc) => acc.providerId === 'uvm-netid')
			: [];
		return providerAccounts.length === 0 ? null : providerAccounts[0];
	});

	let uvmProfileQuery = createQuery(() =>
		orpc.account.getUvmProfile.queryOptions({
			enabled: !(uvmNetIdAccount === null)
		})
	);

	let linkMutation = createMutation(() => ({
		mutationKey: ['auth', 'accounts', 'uvm-netid'],
		mutationFn: () =>
			authClient.oauth2.link({
				providerId: 'uvm-netid',
				callbackURL: '/account?tab=netid',
				errorCallbackURL: '/auth/error?provider=uvm-netid',
				scopes: ['openid', 'email', 'profile']
			}),
		onSettled: async (_d, _e, _v, _r, ctx) =>
			await Promise.allSettled([
				ctx.client.invalidateQueries({ queryKey: accountsQueryOptions.queryKey }),
				ctx.client.invalidateQueries({ queryKey: orpc.account.getUvmProfile.queryKey() })
			])
	}));
</script>

{#snippet linkButton()}
	<Button onclick={async () => await linkMutation.mutateAsync()} disabled={linkMutation.isPending}>
		{#if linkMutation.isPending}
			<LoaderCircle class="h-6 w-auto animate-spin" />
		{/if}
		Link Account</Button
	>
{/snippet}

<Card.Root class="relative">
	{#if linkMutation.isSuccess}
		<Confetti delay={[0, 500]} />
	{/if}
	<Card.Header>
		<Card.Title>UVM NetID</Card.Title>
		<Card.Description
			>Link your UVM NetID to make your account eligible for automatic verification.</Card.Description
		>
	</Card.Header>
	{#if accountQuery.status === 'success'}
		{#if uvmNetIdAccount !== null && uvmProfileQuery.data?.accessTokenExpired === false && uvmProfileQuery.data.userinfo}
			<Card.Content class="flex flex-col">
				<div class="flex gap-x-2">
					<Avatar.Root class="h-16 w-16">
						<Avatar.Image src={uvmProfileQuery.data.userinfo.picture} alt="User avatar" />
						<Avatar.Fallback><CircleUser class="h-16 w-16" /></Avatar.Fallback>
					</Avatar.Root>
					<div class="basis-full">
						<h2 class="font-semibold">{uvmProfileQuery.data.userinfo.name}</h2>
						<Button variant="link" class="text-muted-foreground m-0 p-0 font-mono"
							>{uvmProfileQuery.data.userinfo.email}</Button
						>
					</div>
				</div>
			</Card.Content>
		{:else if uvmProfileQuery.data?.accessTokenExpired === true}
			<Card.Content>
				<WarningAlert title="UVM NetID Reauthentication Required">
					<p class="mb-2">
						You may have already linked your UVM NetID, but our access token has expired and we need
						to refresh it. Please log in again.
					</p>
					{@render linkButton()}
				</WarningAlert>
			</Card.Content>
		{:else}
			<Card.Content>
				{@render linkButton()}
			</Card.Content>
		{/if}
	{:else}
		<Card.Content class="text-muted-foreground italic">Loading</Card.Content>
	{/if}
</Card.Root>
