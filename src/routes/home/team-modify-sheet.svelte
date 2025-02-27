<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import XIcon from 'lucide-svelte/icons/x';
	import CheckIcon from 'lucide-svelte/icons/check';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import queries from '$lib/trpc/client/queries.svelte';
	import { Debounced } from 'runed';
	import mutations from '$lib/trpc/client/mutations.svelte';
	import TicketCreateCombobox from './ticket-create-combobox.svelte';
	import { ticketCreateSheetOpen } from './ticket-create.svelte';
	import TicketCreateForm from './ticket-create-form.svelte';
	import { delay } from '$lib/utils';

	let sheetOpen = $state(false);
	let submitting = $state(false);

	const team = queries.competitorGetMyTeam();
	let teamNameMutation = mutations.competitorUpdateTeam();

	let teamName = $state($team.data?.team.name ?? '');
</script>

<Sheet.Root bind:open={sheetOpen}>
	<Sheet.Trigger class={buttonVariants({ variant: 'default', size: 'lg' })}
		>Modify Team</Sheet.Trigger
	>
	<Sheet.Content side="right" class="font-mono">
		<Sheet.Header>
			<Sheet.Title>Update Team Name</Sheet.Title>
			<Sheet.Description>Update the name of your team</Sheet.Description>
		</Sheet.Header>
		<div>
			<Label>Team Name</Label>
			<Input
				bind:value={teamName}
				disabled={$teamNameMutation.isPending || submitting}
				placeholder="Team Name"
				class="w-full"
			/>
		</div>
		<Sheet.Footer class="mt-4 flex w-full justify-start gap-x-2">
			<Button
				disabled={$teamNameMutation.isPending || submitting}
				onclick={async () => {
					submitting = true;
					await $teamNameMutation.mutateAsync({ name: teamName });
					await delay(1000);
					submitting = false;
					sheetOpen = false;
				}}
			>
				{#if $teamNameMutation.isPending || submitting}
					Updating <LoaderCircle class="mr-2 size-4 animate-spin" />
				{:else}
					Update
				{/if}
			</Button>
			<Sheet.Close class={buttonVariants({ variant: 'outline' })}>Close</Sheet.Close>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
