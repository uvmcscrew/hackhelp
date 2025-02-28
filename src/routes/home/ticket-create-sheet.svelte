<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import TicketCreateCombobox from './ticket-create-combobox.svelte';
	import { ticketCreateSheetOpen } from './ticket-create.svelte';
	import TicketCreateForm from './ticket-create-form.svelte';
</script>

<Sheet.Root bind:open={$ticketCreateSheetOpen}>
	<Sheet.Trigger class={buttonVariants({ variant: 'default' })}>Create Ticket</Sheet.Trigger>
	<Sheet.Content side="right" class="font-mono">
		<Sheet.Header>
			<Sheet.Title>Create Ticket</Sheet.Title>
			<Sheet.Description>Create a ticket from a GitHub Issue</Sheet.Description>
		</Sheet.Header>

		<TicketCreateCombobox />

		<TicketCreateForm />
	</Sheet.Content>
</Sheet.Root>
