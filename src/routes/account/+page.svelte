<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import DoorOpen from 'lucide-svelte/icons/door-open';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';

	import type { PageProps } from './$types';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { goto } from '$app/navigation';
	import CardContent from '@/components/ui/card/card-content.svelte';

	let { data }: PageProps = $props();
	const image = `https://avatars.githubusercontent.com/u/${data.user.githubId}`;

	const inTeam = false;
</script>

<div class="mx-auto flex min-h-screen w-xl flex-col gap-y-4 pt-16">
	<h1 class="w-full text-center text-2xl font-semibold">Account</h1>
	<div class="text-foreground flex w-full justify-center">
		{#if data.user.isInOrganization}
			<Button
				variant="link"
				class="hover:cursor-pointer"
				href={data.user.isAdmin ? '/admin' : '/home'}><ArrowLeft class="h-8 w-8 " />Back</Button
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
					<h2 class="text-2xl font-medium">{data.user.fullName}</h2>
					{#if data.user.isAdmin}
						<Badge class="ml-2 rounded-full bg-purple-400 px-2 py-1" hoverEffects={false}
							>Administrator</Badge
						>
					{/if}
				</span>
				<span class="text-secondary-foreground font-mono">{data.user.username}</span>
			</div>
			<div class="ml-auto grid place-content-start">
				<Button
					variant="destructive"
					title="Sign Out"
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
				{#if data.user.isInOrganization}
					<Badge class="rounded-full bg-green-400 px-2" hoverEffects={false}>Joined</Badge>
				{:else if data.user.isWhitelisted}
					<Button
						size="sm"
						class="rounded-full bg-yellow-400 hover:cursor-pointer hover:bg-yellow-400/80"
						>Request Invitation</Button
					>
				{:else}
					<Badge class="rounded-full bg-red-400 px-2" hoverEffects={false}
						>Contact Event Organizer</Badge
					>
				{/if}
			</div>
			<div class="flex flex-row justify-between">
				<span class="text-secondary-foreground font-semibold">Team Membership Status: </span>
				{#if data.user.teamId !== null}
					<Badge class="rounded-full bg-green-400 px-2" hoverEffects={false}>Joined</Badge>
				{:else}
					<Badge class="rounded-full bg-yellow-400 px-2" hoverEffects={false}>Not in Team</Badge>
				{/if}
			</div>
		</CardContent>
	</Card.Root>
</div>
