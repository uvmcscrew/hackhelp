<svelte:options runes={true} />

<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import DoorOpen from 'lucide-svelte/icons/door-open';

	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	import { goto } from '$app/navigation';
	import MadeWith from '$lib/components/MadeWith.svelte';
	import { posthogHandler } from '$lib/utils';
	import { resolve } from '$app/paths';
	import { sessionQueryOptions, signOutAndClearCache } from '$lib/auth/client.svelte';
	import type { PageProps } from './$types';
	import * as Tabs from '$lib/components/ui/tabs';
	import PasskeysCard from './_cards/passkeys-card.svelte';
	import Profile from './_cards/profile.svelte';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import UVMNetIDAccount from './_cards/uvmnetid-account.svelte';
	import GithubAccount from './_cards/github-account.svelte';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { page } from '$app/state';

	let { data }: PageProps = $props();
	const queryClient = useQueryClient();
	let tab = $state(page.url.searchParams.get('tab') ?? 'profile');

	const session = createQuery(() => ({
		...sessionQueryOptions,
		initialData: data.userInitialData
	}));

	let profilePermissionQuery = createQuery(orpc.account.canCreateProfile.queryOptions);

	const roles = $derived((session.data?.user.role || '').split(','));
	const isAdmin = $derived(roles.includes('admin'));
</script>

<svelte:head>
	<title>Account Home | HackHelp</title>
</svelte:head>

<div class="mx-auto flex min-h-screen w-xl flex-col gap-y-4 pt-16">
	<h1 class="w-full text-center text-2xl font-semibold">Account</h1>
	<div class="text-foreground flex w-full justify-center gap-x-2">
		{#if isAdmin}
			<Button variant="outline" class="hover:cursor-pointer" href="/admin">Admin Dashboard</Button>
		{/if}
		{#if roles.includes('mentor') || isAdmin}
			<Button variant="outline" class="hover:cursor-pointer" href="/mentor">Mentor Dashboard</Button
			>
		{/if}
		{#if roles.includes('judge') || isAdmin}
			<Button variant="outline" class="hover:cursor-pointer" href="/judging">Judge Dashboard</Button
			>
		{/if}
		{#if roles.includes('verifiedUser') && !roles.includes('judge') && !roles.includes('mentor') && !isAdmin}
			<Button variant="outline" class="hover:cursor-pointer" href="/home">Dashboard</Button>
		{/if}
	</div>
	<Card.Root
		><Card.CardHeader class="flex flex-row items-center justify-between"
			><Card.CardTitle>Profile</Card.CardTitle>
			<Button
				variant="destructive"
				title="Sign Out"
				class="hover:cursor-pointer"
				onclick={async () => {
					await signOutAndClearCache(queryClient);
					posthogHandler((posthog) => posthog.reset());
					await goto(resolve('/(auth)/login'));
				}}><DoorOpen class="h-8 w-8" />Sign Out</Button
			></Card.CardHeader
		><Card.CardContent class="flex flex-row"
			><Avatar.Root class="h-16 w-16">
				<Avatar.Image src={session.data?.user.image} alt="User avatar" />
				<Avatar.Fallback><CircleUser class="h-16 w-16" /></Avatar.Fallback>
			</Avatar.Root>
			<div class="flex flex-col pl-4">
				<span class="inline-flex gap-x-2">
					<h2 class="min-h-4 text-lg font-medium">{session.data?.user.name}</h2>
					{#if isAdmin}
						<Badge class="ml-2 rounded-full bg-purple-400 px-2 py-1" hoverEffects={false}
							>Administrator</Badge
						>
					{/if}
				</span>
				<div>
					<span class="text-muted-foreground pt-4 text-sm">{session.data?.user.email}</span>
				</div>
			</div>
		</Card.CardContent>
	</Card.Root>

	<Tabs.Root value={tab}>
		<Tabs.List>
			<Tabs.Trigger value="profile">Profile</Tabs.Trigger>
			<Tabs.Trigger value="passkeys">Passkeys</Tabs.Trigger>
			<Tabs.Trigger value="netid">UVM NetID</Tabs.Trigger>
			{#if profilePermissionQuery.data === true}
				<Tabs.Trigger value="github">GitHub</Tabs.Trigger>
			{/if}
		</Tabs.List>
		<Tabs.Content value="profile">
			<Profile />
		</Tabs.Content>
		<Tabs.Content value="passkeys">
			<PasskeysCard />
		</Tabs.Content>
		<Tabs.Content value="netid">
			<UVMNetIDAccount />
		</Tabs.Content>
		{#if profilePermissionQuery.data === true}
			<Tabs.Content value="github">
				<GithubAccount />
			</Tabs.Content>
		{/if}
	</Tabs.Root>

	<div class="mt-auto mb-2 inline-flex justify-center"><MadeWith /></div>
</div>
