<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command';
	import * as Popover from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';
	import { Label } from '$lib/components/ui/label';
	import queries from '$lib/trpc/client/queries.svelte';

	type Props = {
		initialId?: string;
	};

	let props: Props = $props();

	let open = $state(false);
	let value = $state(props.initialId || '');
	let triggerRef = $state<HTMLButtonElement>(null!);

	let adminsQuery = queries.adminListAllAdmins();

	const selected = $derived($adminsQuery.data?.admins.find((a) => a.id === value)?.fullName);

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<div class="my-4 flex flex-col gap-y-2">
	<Label>Assigned Mentor</Label>

	<Popover.Root bind:open>
		<Popover.Trigger bind:ref={triggerRef}>
			{#snippet child({ props })}
				<Button
					variant="outline"
					class="w-full justify-between"
					{...props}
					role="combobox"
					aria-expanded={open}
				>
					{selected ? selected : 'Select an admin'}
					<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-full p-0">
			<Command.Root>
				<Command.Input placeholder="Search admins..." />
				<Command.List>
					<Command.Empty>No matching user</Command.Empty>
					<Command.Group>
						{#if $adminsQuery.data}
							{#each $adminsQuery.data.admins as adminData}
								<Command.Item
									value={adminData.id}
									onSelect={() => {
										value = adminData.id;
										closeAndFocusTrigger();
									}}
								>
									<Check class={cn('mr-2 size-4', value !== adminData.id && 'text-transparent')} />
									{adminData.fullName}
									<span class="text-muted-foreground">@{adminData.username}</span>
								</Command.Item>
							{/each}
						{/if}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div>
