<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import TicketCreateSheet from './ticket-create-sheet.svelte';
</script>

<Card.Card class="col-span-2 col-start-2 row-span-2 row-start-1">
	<Card.Header class="flex flex-row items-center justify-between">
		<Card.Title class="h-full">Tickets</Card.Title>
		<TicketCreateSheet />
	</Card.Header>
	<Card.Content>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-max">Title</Table.Head>
					<Table.Head>Issue Link</Table.Head>
					<Table.Head class="w-min">Status</Table.Head>
					<Table.Head>Assigned To</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body></Table.Body>
		</Table.Root>
	</Card.Content>
</Card.Card>
