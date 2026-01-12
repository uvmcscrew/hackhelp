<script lang="ts">
	import TicketStatusBadge from '$lib/components/ticket-status-badge.svelte';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { clientEnv } from '$lib/env/client';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import TicketCreateSheet from './ticket-create-sheet.svelte';
	import { MarkGithub24 as GithubIcon } from 'svelte-octicons';

	let ticketsQuery = createQuery(orpc.competitor.tickets.getTickets.queryOptions);
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
					<Table.Head class="text-left">Issue Link</Table.Head>
					<Table.Head class="w-min">Status</Table.Head>
					<Table.Head>Assigned Mentor</Table.Head>
					<!-- <Table.Head>Actions</Table.Head> -->
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if ticketsQuery.data}
					{#each ticketsQuery.data.tickets as ticket}
						<Table.Row>
							<Table.Cell>{ticket.title}</Table.Cell>
							<Table.Cell class="">
								<a
									href={`https://github.com/${clientEnv.PUBLIC_GITHUB_ORGNAME}/${ticket.repository}/issues/${ticket.issueNumber}`}
									target="_blank"
									class={buttonVariants({
										variant: 'link',
										class: 'inline-flex items-center px-0'
									})}
								>
									<GithubIcon class="fill-primary size-5!" />
									{`${ticket.repository}#${ticket.issueNumber}`}
								</a>
							</Table.Cell>
							<Table.Cell><TicketStatusBadge status={ticket.resolutionStatus} /></Table.Cell>
							<Table.Cell
								>{ticket.assignedMentorName
									? ticket.assignedMentorName
									: 'Not Assigned'}</Table.Cell
							>
						</Table.Row>
					{/each}

					{#if ticketsQuery.data.tickets.length === 0}
						<Table.Row>
							<Table.Cell colspan={4} class="text-muted-foreground text-center italic">
								No tickets found.
							</Table.Cell>
						</Table.Row>
					{/if}
				{:else if ticketsQuery.isLoading}
					<Table.Row>
						<Table.Cell colspan={4} class="text-muted-foreground text-center italic">
							Loading Tickets
						</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	</Card.Content>
</Card.Card>
