<script lang="ts">
	import TicketStatusBadge from '$lib/components/ticket-status-badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { clientEnv } from '$lib/env/client';
	import { MarkGithub24 as GithubIcon } from 'svelte-octicons';
	import { formatDistance } from 'date-fns';
	import UserPen from 'lucide-svelte/icons/user-pen';
	import SquareChevronRight from 'lucide-svelte/icons/square-chevron-right';
	import { goto } from '$app/navigation';
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';

	let tixQuery = createQuery(orpc.admin.tickets.getOpenTickets.queryOptions);
	let accountQuery = createQuery(orpc.account.whoami.queryOptions);

	let selfAssignMutation = createMutation(orpc.admin.tickets.selfAssignMutation.mutationOptions);

	let queryClient = useQueryClient();
</script>

<Card.Card class=" max-h-full overflow-y-scroll">
	<Card.Header class="flex flex-row items-center justify-between">
		<span class="flex flex-col gap-y-2">
			<Card.Title class="h-full">All Tickets</Card.Title>
			<Card.Description>All Help Tickets</Card.Description>
		</span>
		<Button
			size="default"
			onclick={async () => await queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] })}
			>Refresh</Button
		>
	</Card.Header>
	<Card.Content>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-max">Title</Table.Head>
					<Table.Head class="w-48">Issue Link</Table.Head>
					<Table.Head>Challenge Link</Table.Head>
					<Table.Head class="">Created</Table.Head>
					<Table.Head class="">Room</Table.Head>
					<Table.Head class="w-30">Status</Table.Head>
					<Table.Head class="">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if tixQuery.data}
					{#each tixQuery.data.tickets as ticket}
						<Table.Row>
							<Table.Cell>{ticket.title}</Table.Cell>
							<Table.Cell class="max-w-48 overflow-x-scroll"
								><Button
									href={`https://github.com/${clientEnv.PUBLIC_GITHUB_ORGNAME}/${ticket.repository}/issues/${ticket.issueNumber}`}
									variant="link"
									class="max-w-full overflow-x-scroll px-0"
									target="_blank"
								>
									<GithubIcon
										class=" fill-primary size-5!"
									/>{ticket.repository}#{ticket.issueNumber}
								</Button></Table.Cell
							>
							<Table.Cell>
								{#if ticket.challengeRepo}
									<Button
										href={`https://github.com/${clientEnv.PUBLIC_GITHUB_ORGNAME}/${ticket.challengeRepo}`}
										variant="link"
										class="px-0"
										target="_blank"
									>
										<GithubIcon class="fill-primary size-5!" />{ticket.challengeRepo}
									</Button>
								{:else}
									No challenge
								{/if}
							</Table.Cell>
							<Table.Cell title={ticket.createdAt.toString()}
								>{formatDistance(ticket.createdAt, Date.now(), { addSuffix: true })}</Table.Cell
							>
							<Table.Cell>{ticket.location}</Table.Cell>
							<Table.Cell><TicketStatusBadge status={ticket.resolutionStatus} /></Table.Cell>
							<Table.Cell>
								<Button
									title="Assign issue to self"
									disabled={accountQuery.data?.user?.id === ticket.assignedMentorId}
									onclick={async () => {
										await selfAssignMutation.mutateAsync({ ticketId: ticket.id });
									}}
									variant="outline"
									size="icon"><UserPen class="size-4" /></Button
								>
								<Button
									variant="outline"
									size="icon"
									onclick={async () => {
										await goto(`/admin?ticketId=${ticket.id}`);
									}}><SquareChevronRight class="size-4" /></Button
								>
							</Table.Cell>
						</Table.Row>
					{/each}
					{#if tixQuery.data.tickets.length === 0}
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
