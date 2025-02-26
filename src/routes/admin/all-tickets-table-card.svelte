<script lang="ts">
	import TicketStatusBadge from '$lib/components/ticket-status-badge.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { clientEnv } from '$lib/env/client';
	import queries from '$lib/trpc/client/queries.svelte';
	import GithubIcon from 'lucide-svelte/icons/github';
	import { formatRelative, formatDistance } from 'date-fns';

	let tixQuery = queries.adminGetAllOpenTickets();
</script>

<Card.Card class="">
	<Card.Header class="flex flex-row items-center justify-between">
		<span class="flex flex-col gap-y-2">
			<Card.Title class="h-full">All Tickets</Card.Title>
			<Card.Description>All Help Tickets</Card.Description>
		</span>
		<Button size="default">View All Tickets</Button>
	</Card.Header>
	<Card.Content>
		<Table.Root>
			<Table.Header>
				<Table.Head class="w-max">Title</Table.Head>
				<Table.Head>Issue Link</Table.Head>
				<Table.Head>Challenge Link</Table.Head>
				<Table.Head class="">Created</Table.Head>
				<Table.Head class="w-30">Status</Table.Head>
				<Table.Head class="">Actions</Table.Head>
			</Table.Header>
			<Table.Body>
				{#if $tixQuery.data}
					{#each $tixQuery.data.tickets as ticket}
						<Table.Row>
							<Table.Cell>{ticket.title}</Table.Cell>
							<Table.Cell
								><Button
									href={`https://github.com/${clientEnv.PUBLIC_GITHUB_ORGNAME}/${ticket.repository}/issues/${ticket.issueNumber}`}
									variant="link"
								>
									<GithubIcon class="mr-2 size-4" />{ticket.repository}#{ticket.issueNumber}
								</Button></Table.Cell
							>
							<Table.Cell>
								{#if ticket.challengeRepo}
									<Button
										href={`https://github.com/${clientEnv.PUBLIC_GITHUB_ORGNAME}/${ticket.challengeRepo}`}
										variant="link"
									>
										<GithubIcon class="mr-2 size-4" />{ticket.repository}#{ticket.issueNumber}
									</Button>
									>
								{:else}
									No challenge
								{/if}
							</Table.Cell>
							<Table.Cell title={ticket.createdAt.toString()}
								>{formatDistance(ticket.createdAt, Date.now(), { addSuffix: true })}</Table.Cell
							>
							<Table.Cell><TicketStatusBadge status={ticket.resolutionStatus} /></Table.Cell>
							<Table.Cell></Table.Cell>
						</Table.Row>
					{/each}
					{#if $tixQuery.data.tickets.length === 0}
						<Table.Row>
							<Table.Cell colspan={6} class="text-muted-foreground text-center italic">
								No tickets found.
							</Table.Cell>
						</Table.Row>
					{/if}
				{/if}
			</Table.Body>
		</Table.Root>
	</Card.Content>
</Card.Card>
