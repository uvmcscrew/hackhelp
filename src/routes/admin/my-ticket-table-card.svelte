<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import GithubIcon from 'lucide-svelte/icons/github';
</script>

<Card.Card class="col-span-3 col-start-2 row-span-3 row-start-1">
	<Card.Header class="flex flex-row items-center justify-between">
		<span class="flex flex-col gap-y-2">
			<Card.Title class="h-full">My Tickets</Card.Title>
			<Card.Description>Help tickets assigned to me</Card.Description>
		</span>
		<Button size="default">View All Tickets</Button>
	</Card.Header>
	<Card.Content>
		<Table.Root>
			<Table.Header>
				<Table.Head class="w-max">Title</Table.Head>
				<Table.Head>Issue Link</Table.Head>
				<Table.Head class="w-32">Location</Table.Head>
				<Table.Head class="w-32">Created</Table.Head>
				<Table.Head class="w-30">Status</Table.Head>
			</Table.Header>
			<Table.Body>
				<Table.Row
					><Table.Cell>Python Tkinter not rendering</Table.Cell>
					<Table.Cell class="text-foreground hover:text-primary inline-flex items-center underline"
						><a
							href="https://github.com/uvm-cscrew/"
							class="text-foreground hover:text-primary inline-flex items-center underline"
						>
							<GithubIcon class="mr-2 h-4 w-4" />inventory-master#16
						</a></Table.Cell
					>
					<Table.Cell>Kalkin 007</Table.Cell>
					<Table.Cell>7 mins ago</Table.Cell>
					<Table.Cell><Badge variant="destructive">Unresolved</Badge></Table.Cell>
				</Table.Row>
				<Table.Row
					><Table.Cell>Can't get data to update on frontend</Table.Cell>
					<Table.Cell class="text-foreground/80 font-underline inline-flex items-center"
						><GithubIcon class="mr-2 h-4 w-4" />amazing-student-store#2</Table.Cell
					>
					<Table.Cell>Kalkin 003</Table.Cell>
					<Table.Cell>7 mins ago</Table.Cell>
					<Table.Cell><Badge class=" bg-blue-600/80 text-white">In Progress</Badge></Table.Cell>
				</Table.Row>
				<Table.Row
					><Table.Cell>CMake unresolved symbols, but we have header files!!</Table.Cell>
					<Table.Cell class="text-foreground/80 font-underline inline-flex items-center"
						><GithubIcon class="mr-2 h-4 w-4" />magnificent-game#7</Table.Cell
					>
					<Table.Cell>Ifshin 240</Table.Cell>
					<Table.Cell>1 hour ago</Table.Cell>
					<Table.Cell
						><Badge class=" bg-green-600/80 text-center text-white">Confirming</Badge></Table.Cell
					>
				</Table.Row>
			</Table.Body>
		</Table.Root>
	</Card.Content>
</Card.Card>
