<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import DoorOpen from 'lucide-svelte/icons/door-open';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import CardContent from '$lib/components/ui/card/card-content.svelte';

	import type { PageProps } from './$types';

	import { goto } from '$app/navigation';
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { trpcClient } from '$lib/trpc/client/index.svelte';
	import PageContent from './PageContent.svelte';
	import { getAccountWithStatus } from '$lib/trpc/client/queries.svelte';

	let pgProps: PageProps = $props();

	let accountWithStatus = getAccountWithStatus(pgProps.data);

	const image = `https://avatars.githubusercontent.com/u/${$accountWithStatus.data.user.githubId}`;

	const queryClient = useQueryClient();

	const mutation = createMutation({
		mutationFn: async () => {
			const res = await fetch('/api/hello');
			return res.json();
		},
		onSuccess: (data) => {
			console.log(data);
		}
	});
	// $inspect(data);
</script>

<div class="mx-auto flex min-h-screen w-xl flex-col gap-y-4 pt-16">
	<h1 class="w-full text-center text-2xl font-semibold">Account</h1>
	<div class="text-foreground flex w-full justify-center">
		{#if $accountWithStatus.data.user.isInOrganization}
			<Button
				variant="link"
				class="hover:cursor-pointer"
				href={$accountWithStatus.data.user.isAdmin ? '/admin' : '/home'}
				><ArrowLeft class="h-8 w-8 " />Back</Button
			>
		{/if}
	</div>
	<Card.Root
		><Card.CardHeader><Card.CardTitle>Profile</Card.CardTitle></Card.CardHeader><Card.CardContent
			class="flex flex-row"
			><Avatar.Root class="h-16 w-16">
				<Avatar.Image src={image} alt="User avatar" />
				<Avatar.Fallback><CircleUser class="h-16 w-16" /></Avatar.Fallback>
			</Avatar.Root>
			<div class="flex flex-col pl-4">
				<span class="inline-flex gap-x-2">
					<h2 class="text-2xl font-medium">{$accountWithStatus.data.user.fullName}</h2>
					{#if $accountWithStatus.data.user.isAdmin}
						<Badge class="ml-2 rounded-full bg-purple-400 px-2 py-1" hoverEffects={false}
							>Administrator</Badge
						>
					{/if}
				</span>
				<span class="text-secondary-foreground font-mono"
					>{$accountWithStatus.data.user.username}</span
				>
			</div>
			<div class="ml-auto grid place-content-start">
				<Button
					variant="destructive"
					title="Sign Out"
					class="hover:cursor-pointer"
					onclick={async () => {
						await fetch('/auth/logout', { method: 'POST' });
						await goto('/auth/login');
					}}><DoorOpen class="h-8 w-8" />Sign Out</Button
				>
			</div>
		</Card.CardContent>
	</Card.Root>
	<Card.Root>
		<Card.Header><Card.Title>Participant Status</Card.Title></Card.Header>
		<CardContent class="flex flex-col gap-y-2">
			<div class="flex flex-row justify-between">
				<span class="text-secondary-foreground font-semibold"
					>Organization Membership Status:
				</span>
				{#if $accountWithStatus.data.user.isInOrganization}
					<Badge class="rounded-full bg-green-400 px-2" hoverEffects={false}>Joined</Badge>
				{:else if $accountWithStatus.data.userStatus.isWhitelisted}
					<Button
						size="sm"
						onclick={async () => {
							queryClient.invalidateQueries({ queryKey: ['user', 'userStatus'] });
						}}
						class=" bg-cyan-500 hover:cursor-pointer hover:bg-cyan-500/80"
						formaction="/account?/requestInvite">Request Invitation</Button
					>
				{:else}
					<Badge class="rounded-full bg-red-400 px-2" hoverEffects={false}
						>Contact Event Organizer</Badge
					>
				{/if}
			</div>
			<div class="flex flex-row justify-between">
				<span class="text-secondary-foreground font-semibold">Team Membership Status: </span>
				{#if $accountWithStatus.data.user.teamId !== null}
					<Badge class="rounded-full bg-green-400 px-2" hoverEffects={false}>Joined</Badge>
				{:else}
					<Badge class="rounded-full bg-amber-400 px-2" hoverEffects={false}>Not in Team</Badge>
				{/if}
			</div>
		</CardContent>
	</Card.Root>
</div>
