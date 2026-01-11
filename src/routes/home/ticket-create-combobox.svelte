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
	import { issueId, ticketCreateSheetOpen } from './ticket-create.svelte';
	import { watch } from 'runed';

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	let issuesQuery = queries.competitorGetAllTeamIssues();

	const selectedIssue = $derived(
		issuesQuery.data?.issues.find((iss) => iss.id.toString() === $issueId)
	);

	watch(
		() => $ticketCreateSheetOpen,
		(curr, prev) => {
			if (curr === false && prev === true) {
				issueId.set(null);
				console.log('Resetting issueId');
			}
		}
	);

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
	<Label>Github Issue</Label>

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
					{selectedIssue ? selectedIssue.title : 'Select an issue...'}
					<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-full p-0">
			<Command.Root>
				<Command.Input placeholder="Search issues..." />
				<Command.List>
					<Command.Empty>No matching issue</Command.Empty>
					<Command.Group>
						{#if issuesQuery.data}
							{#each issuesQuery.data?.issues as issueData}
								<Command.Item
									value={issueData.id.toString()}
									onSelect={() => {
										issueId.set(issueData.id.toString());
										closeAndFocusTrigger();
									}}
								>
									<Check
										class={cn(
											'mr-2 size-4',
											$issueId !== issueData.id.toString() && 'text-transparent'
										)}
									/>
									{issueData.title}
									<span class="text-muted-foreground"
										>{issueData.repoName}#{issueData.issueNumber}</span
									>
								</Command.Item>
							{/each}
						{/if}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div>
