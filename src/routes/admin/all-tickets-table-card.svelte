<script lang="ts">
	import TicketStatusBadge from '$lib/components/ticket-status-badge.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { clientEnv } from '$lib/env/client';
	import queries from '$lib/trpc/client/queries.svelte';
	import { MarkGithub24 as GithubIcon } from 'svelte-octicons';
	import { formatRelative, formatDistance } from 'date-fns';
	import UserPen from 'lucide-svelte/icons/user-pen';
	import SquareChevronRight from 'lucide-svelte/icons/square-chevron-right';
	import mutations from '$lib/trpc/client/mutations.svelte';
	import { page } from '$app/state';
	import { goto, pushState } from '$app/navigation';

	let tixQuery = queries.adminGetAllOpenTickets();
	let accountQuery = queries.queryWhoamiNoInitial();

	let selfAssignMutation = mutations.adminSelfAssignTicket();
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
									class="px-0"
									target="_blank"
								>
									<GithubIcon
										class=" fill-primary !size-5"
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
										<GithubIcon
											class="fill-primary !size-5"
										/>{ticket.challengeRepo}#{ticket.issueNumber}
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
							<Table.Cell>
								<Button
									title="Assign issue to self"
									disabled={$accountQuery.data?.user?.id === ticket.assignedMentorId}
									onclick={async () => {
										await $selfAssignMutation.mutateAsync({ ticketId: ticket.id });
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
