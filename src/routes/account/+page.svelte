<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import DoorOpen from 'lucide-svelte/icons/door-open';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import MoveUpRight from 'lucide-svelte/icons/move-up-right';
	import RefreshCW from 'lucide-svelte/icons/refresh-cw';

	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import CardContent from '$lib/components/ui/card/card-content.svelte';

	import type { PageProps } from './$types';

	import { goto } from '$app/navigation';
	import queries from '$lib/trpc/client/queries.svelte';
	import mutations from '$lib/trpc/client/mutations.svelte';
	import { clientEnv } from '$lib/env/client';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
	import { toast } from 'svelte-sonner';
	import MadeWith from '$lib/components/MadeWith.svelte';
	import { delay, posthogHandler } from '$lib/utils';

	let pgProps: PageProps = $props();

	let accountWithStatus = queries.queryWhoamiWithProfile(pgProps.data);
	let hasInvite = queries.hasPendingInvite();

	let inviteRefreshLoading = $state(false);

	const image = `https://avatars.githubusercontent.com/u/${$accountWithStatus.data.user.githubId}`;

	let sendInvite = mutations.requestInvite({
		onSuccess: () =>
			toast.success('Invitation created', {
				action: {
					label: 'View',
					onClick: () =>
						goto(`https://github.com/orgs/${clientEnv.PUBLIC_GITHUB_ORGNAME}/invitation`)
				}
			})
	});

	let refreshInvite = mutations.refreshInvite();

	let leaveTeam = mutations.competitorLeaveTeam();

	posthogHandler((posthog) =>
		posthog.identify($accountWithStatus.data.user.username, {
			id: $accountWithStatus.data.user.id,
			username: $accountWithStatus.data.user.username,
			isOrgAdmin: $accountWithStatus.data.user.isOrgAdmin,
			isOrgMember: $accountWithStatus.data.user.isOrgMember
		})
	);
</script>

<div class="mx-auto flex min-h-screen w-xl flex-col gap-y-4 pt-16">
	<h1 class="w-full text-center text-2xl font-semibold">Account</h1>
	<div class="text-foreground flex w-full justify-center">
		{#if $accountWithStatus.data.user.isOrgMember}
			<Button
				variant="link"
				class="hover:cursor-pointer"
				href={$accountWithStatus.data.user.isOrgAdmin ? '/admin' : '/home'}
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
					{#if $accountWithStatus.data.user.isOrgAdmin}
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
						posthogHandler((posthog) => posthog.reset());
						await goto('/auth/login');
					}}><DoorOpen class="h-8 w-8" />Sign Out</Button
				>
			</div>
		</Card.CardContent>
	</Card.Root>
	<Card.Root>
		<Card.Header><Card.Title>Participant Status</Card.Title></Card.Header>
		<CardContent class="flex flex-col gap-y-2">
			<div class="flex flex-row items-center justify-between">
				<span class="text-secondary-foreground font-semibold"
					>Organization Membership Status:
				</span>
				{#if $accountWithStatus.data.user.isOrgMember}
					<Badge class="rounded-full bg-green-400 px-2" hoverEffects={false}>Joined</Badge>
				{:else if $accountWithStatus.data.userStatus.isWhitelisted}
					<Badge class="rounded-full bg-amber-400 px-2" hoverEffects={false}>Pending Invite</Badge>
				{:else}
					<Badge class="rounded-full bg-red-400 px-2" hoverEffects={false}
						>Contact Event Organizer</Badge
					>
				{/if}
			</div>
			<div class="flex flex-row items-center justify-end gap-x-3">
				{#if !$accountWithStatus.data.user.isOrgMember && $accountWithStatus.data.userStatus.isWhitelisted}
					{#if $hasInvite.data}
						{#if $hasInvite.data.hasPendingInvite}
							<Button
								size="sm"
								variant="outline"
								class="p-2 text-center  hover:cursor-pointer "
								onclick={async () => {
									inviteRefreshLoading = true;
									await $refreshInvite.mutateAsync();
									await delay(3500);
									inviteRefreshLoading = false;
								}}
								disabled={$refreshInvite.isPending || inviteRefreshLoading}
							>
								{#if inviteRefreshLoading}
									<RefreshCW class="mr-1 h-6 w-6 animate-spin" /> Refreshing...
								{:else}
									<RefreshCW class="mr-1 h-6 w-6" /> Refresh Status
								{/if}
							</Button>
							<Button
								size="sm"
								href="https://github.com/orgs/{clientEnv.PUBLIC_GITHUB_ORGNAME}/invitation"
								target="_blank"
								class=" w-[8.25rem] bg-blue-500 p-2 text-center text-white hover:cursor-pointer hover:bg-blue-500/80"
							>
								<MoveUpRight class="mr-1 h-6 w-6 " /> View Invitation</Button
							>
						{:else}
							<Button
								size="sm"
								onclick={async () => {
									await $sendInvite.mutateAsync();
								}}
								disabled={$sendInvite.isPending || inviteRefreshLoading}
								class=" w-[8.25rem] bg-blue-500 p-2 text-center text-white hover:cursor-pointer  hover:bg-blue-500/80"
							>
								{#if $sendInvite.isPending}
									<LoaderCircle class="mr-1 h-6 w-6 animate-spin" /> Inviting...
								{:else}
									Request Invitation
								{/if}
							</Button>
						{/if}
					{:else}
						<Skeleton class="h-8 w-[8.25rem]" />
					{/if}
				{/if}
			</div>
			<div class="flex flex-row items-center justify-between">
				<span class="text-secondary-foreground font-semibold">Team Membership Status: </span>
				{#if $accountWithStatus.data.user.teamId !== null}
					<Badge class="rounded-full bg-green-400 px-2" hoverEffects={false}>Joined Team</Badge>
				{:else}
					<Badge class="rounded-full bg-red-400 px-2" hoverEffects={false}>Not in Team</Badge>
				{/if}
			</div>

			<div class="flex flex-row items-center justify-end">
				{#if $accountWithStatus.data.user.teamId !== null}
					<Button variant="destructive" onclick={async () => await $leaveTeam.mutateAsync()}>
						{#if $leaveTeam.isPending}
							<LoaderCircle class="mr-1 h-6 w-6 animate-spin" /> Leaving...
						{:else}
							Leave Team
						{/if}
					</Button>
				{/if}
			</div>
		</CardContent>
	</Card.Root>
	<div class="mt-auto mb-2 inline-flex justify-center"><MadeWith /></div>
</div>
