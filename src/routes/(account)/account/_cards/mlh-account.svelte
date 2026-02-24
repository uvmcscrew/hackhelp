<script lang="ts">
	import { authClient } from '$lib/auth/client.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { accountsQueryOptions } from './accounts';
	import type { UserAccounts } from '$lib/auth/server.server';
	import { orpc } from '$lib/orpc/client/index.svelte';
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

	let mlhAccount = $derived.by(() => {
		let providerAccounts = accountQuery.data
			? accountQuery.data.filter((acc) => acc.providerId === 'mlh')
			: [];
		return providerAccounts.length === 0 ? null : providerAccounts[0];
	});

	let mlhProfileQuery = createQuery(() =>
		orpc.account.getMlhProfile.queryOptions({
			enabled: !(mlhAccount === null)
		})
	);

	let linkMutation = createMutation(() => ({
		mutationKey: ['auth', 'accounts', 'mlh'],
		mutationFn: () =>
			authClient.oauth2.link({
				providerId: 'mlh',
				callbackURL: '/account?tab=mlh',
				errorCallbackURL: '/auth/error?provider=mlh'
			}),
		onSettled: async (_d, _e, _v, _r, ctx) =>
			await Promise.allSettled([
				ctx.client.invalidateQueries({ queryKey: accountsQueryOptions.queryKey }),
				ctx.client.invalidateQueries({ queryKey: orpc.account.getMlhProfile.queryKey() })
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

<Card.Root>
	<Card.Header>
		<Card.Title>MLH</Card.Title>
		<Card.Description>Link your MLH (Major League Hacking) account.</Card.Description>
	</Card.Header>
	{#if accountQuery.status === 'success'}
		{#if mlhAccount !== null && mlhProfileQuery.data?.accessTokenExpired === false && mlhProfileQuery.data.profile}
			<Card.Content class="flex flex-col">
				<div class="flex gap-x-2">
					<div class="basis-full">
						<h2 class="font-semibold">
							{[mlhProfileQuery.data.profile.first_name, mlhProfileQuery.data.profile.last_name]
								.filter(Boolean)
								.join(' ')}
						</h2>
						<span class="text-muted-foreground text-sm">{mlhProfileQuery.data.profile.email}</span>
						{#if mlhProfileQuery.data.profile.education?.[0]?.school_name}
							<p class="text-muted-foreground text-sm">
								{mlhProfileQuery.data.profile.education[0].school_name}
							</p>
						{/if}
						{#if mlhProfileQuery.data.profile.education?.[0]?.major}
							<p class="text-muted-foreground text-sm">
								{mlhProfileQuery.data.profile.education[0].major}
							</p>
						{/if}
					</div>
				</div>
			</Card.Content>
		{:else if mlhProfileQuery.data?.accessTokenExpired === true}
			<Card.Content>
				<WarningAlert title="MLH Reauthentication Required">
					<p class="mb-2">
						You have linked your MLH account, but the access token has expired. Please link again to
						refresh it.
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
