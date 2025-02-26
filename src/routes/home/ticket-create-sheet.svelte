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

	let sheetOpen = $state(false);
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
