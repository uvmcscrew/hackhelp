<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createMutation } from '@tanstack/svelte-query';

	type Props = {
		ticketId: string;
	};

	let { ticketId }: Props = $props();

	let changeTicketStatusMutation = createMutation(
		orpc.admin.tickets.updateTicketStatusMutation.mutationOptions
	);
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
