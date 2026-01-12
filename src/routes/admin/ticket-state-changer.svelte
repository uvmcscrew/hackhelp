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
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import { Debounced, watch } from 'runed';
	import mutations from '$lib/trpc/client/mutations.svelte';

	type Props = {
		ticketId: string;
	};

	let { ticketId }: Props = $props();

	let changeTicketStatusMutation = mutations.adminChangeTicketStatus();
</script>

<div class="my-4 flex flex-col gap-y-2">
	<Label>Ticket Status</Label>

	<div class="flex w-full flex-row items-center gap-x-2">
		<Button
			onclick={async () => {
				console.log('marking ticket open', ticketId);
				await changeTicketStatusMutation.mutateAsync({ status: 'open', ticketId });
			}}
			disabled={changeTicketStatusMutation.isPending}
			class="bg-uvm-gold  text-black"
			size="sm">Set Open</Button
		>
		<Button
			onclick={async () => {
				console.log('marking ticket in progress', ticketId);
				await changeTicketStatusMutation.mutateAsync({ status: 'inProgress', ticketId });
			}}
			disabled={changeTicketStatusMutation.isPending}
			class=" bg-purple-600/80 text-white"
			size="sm">Mark In Progress</Button
		>
		<Button
			onclick={async () => {
				console.log('marking ticket in progress', ticketId);
				await changeTicketStatusMutation.mutateAsync({ status: 'closed', ticketId });
			}}
			disabled={changeTicketStatusMutation.isPending}
			class=" bg-green-600/80 text-white"
			size="sm">Resolve</Button
		>
	</div>
</div>
