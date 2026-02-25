<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import Fuse from 'fuse.js';
	import { Button } from '$lib/components/ui/button';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import Check from 'lucide-svelte/icons/check';
	import { cn } from '$lib/utils';

	type Props = {
		selectedUserId?: string;
	};

	let { selectedUserId = $bindable('') }: Props = $props();

	let captainSearch = $state('');
	let comboboxOpen = $state(false);

	const usersWoTeamQuery = createQuery(() => orpc.admin.teams.usersWithoutTeam.queryOptions());

	const selectedUser = $derived(usersWoTeamQuery.data?.find((u) => u.id === selectedUserId));

	const fuseSearch = $derived(
		new Fuse(usersWoTeamQuery.data || [], { findAllMatches: true, keys: ['name', 'email'] })
	);

	const filteredUsers = $derived(
		captainSearch === ''
			? usersWoTeamQuery.data || []
			: fuseSearch.search(captainSearch).map((r) => r.item)
	);
</script>

<Popover.Root bind:open={comboboxOpen}>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button variant="outline" class="w-full justify-between font-normal" {...props}>
				{#if selectedUser}
					{selectedUser.name || selectedUser.email}
				{:else}
					<span class="text-muted-foreground">Select a user...</span>
				{/if}
				<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-(--bits-popover-trigger-width) p-0" align="start">
		<Command.Root shouldFilter={false}>
			<Command.Input placeholder="Search users..." bind:value={captainSearch} />
			<Command.List>
				{#if usersWoTeamQuery.isLoading}
					<Command.Loading>
						<p class="py-2 text-center text-sm">Loading...</p>
					</Command.Loading>
				{/if}
				<Command.Empty>No users found.</Command.Empty>
				<Command.Group>
					{#each filteredUsers as user (user.id)}
						<Command.Item
							value={user.id}
							onSelect={() => {
								selectedUserId = user.id;
								comboboxOpen = false;
							}}
						>
							<Check
								class={cn('mr-2 h-4 w-4', selectedUserId === user.id ? 'opacity-100' : 'opacity-0')}
							/>
							<div class="flex flex-col">
								<span class="text-sm">{user.name || 'Unnamed'}</span>
								<span class="text-muted-foreground text-xs">{user.email}</span>
							</div>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
