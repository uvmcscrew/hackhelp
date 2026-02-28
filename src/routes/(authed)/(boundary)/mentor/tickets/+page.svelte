<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { clientEnv } from '$lib/env/client';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Select from '$lib/components/ui/select';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import TicketStatusBadge from '$lib/components/ticket-status-badge.svelte';
	import { MarkGithub24 as GithubIcon } from 'svelte-octicons';
	import EllipsisVertical from 'lucide-svelte/icons/ellipsis-vertical';
	import type { TicketResolutionStatus } from '$lib/server/db/schema';

	const queryClient = useQueryClient();

	// ─── Filter State ────────────────────────────────────────────────────
	let statusFilter = $state<TicketResolutionStatus | 'all'>('all');

	// ─── Queries ─────────────────────────────────────────────────────────
	const allTicketsQuery = createQuery(() =>
		orpc.tickets.allTickets.queryOptions({
			input: statusFilter === 'all' ? undefined : { status: statusFilter }
		})
	);

	const myTicketsQuery = createQuery(() => orpc.tickets.myAssignedTickets.queryOptions());

	// ─── Mutations ───────────────────────────────────────────────────────
	const claimMutation = createMutation(() =>
		orpc.tickets.claimTicket.mutationOptions({
			onSuccess: () => invalidateTickets()
		})
	);

	const updateStatusMutation = createMutation(() =>
		orpc.tickets.updateStatus.mutationOptions({
			onSuccess: () => invalidateTickets()
		})
	);

	function invalidateTickets() {
		queryClient.invalidateQueries({ queryKey: ['tickets'] });
	}

	function handleClaim(ticketId: string) {
		claimMutation.mutate({ ticketId });
	}

	function handleStatusChange(ticketId: string, status: TicketResolutionStatus) {
		updateStatusMutation.mutate({ ticketId, status });
	}

	type TicketRow = {
		id: string;
		title: string;
		createdAt: Date;
		resolutionStatus: TicketResolutionStatus;
		repository: string;
		issueNumber: number;
		assignedMentorId: string | null;
		assignedMentorName: string | null;
		teamId: string | null;
		teamName: string | null;
		teamRoom: string | null;
		teamLocationDescription: string | null;
	};
</script>

<svelte:head>
	<title>Tickets - Mentor</title>
</svelte:head>

<div class="container mx-auto flex max-w-5xl flex-col gap-6 py-8">
	<h1 class="text-2xl font-bold">Tickets</h1>

	<Tabs.Root value="all">
		<Tabs.List>
			<Tabs.Trigger value="all">All Tickets</Tabs.Trigger>
			<Tabs.Trigger value="mine">My Tickets</Tabs.Trigger>
		</Tabs.List>

		<!-- ─── All Tickets Tab ─────────────────────────────────────────── -->
		<Tabs.Content value="all">
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between">
					<div>
						<Card.Title>All Tickets</Card.Title>
						<Card.Description>
							{allTicketsQuery.data?.tickets.length ?? 0} tickets
						</Card.Description>
					</div>
					<div class="w-40">
						<Select.Root
							type="single"
							value={statusFilter}
							onValueChange={(v) => {
								if (v) statusFilter = v as typeof statusFilter;
							}}
						>
							<Select.Trigger>
								{statusFilter === 'all' ? 'All statuses' : statusFilter}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="all" label="All statuses" />
								<Select.Item value="open" label="Open" />
								<Select.Item value="claimed" label="Claimed" />
								<Select.Item value="inProgress" label="In Progress" />
								<Select.Item value="resolved" label="Resolved" />
							</Select.Content>
						</Select.Root>
					</div>
				</Card.Header>
				<Card.Content>
					{@render ticketTable(allTicketsQuery.data?.tickets ?? [], allTicketsQuery.isLoading)}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<!-- ─── My Tickets Tab ──────────────────────────────────────────── -->
		<Tabs.Content value="mine">
			<Card.Root>
				<Card.Header>
					<Card.Title>My Tickets</Card.Title>
					<Card.Description>
						{myTicketsQuery.data?.tickets.length ?? 0} tickets assigned to you
					</Card.Description>
				</Card.Header>
				<Card.Content>
					{@render ticketTable(myTicketsQuery.data?.tickets ?? [], myTicketsQuery.isLoading)}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>

{#snippet ticketTable(tickets: TicketRow[], loading: boolean)}
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Team</Table.Head>
				<Table.Head>Title</Table.Head>
				<Table.Head>Issue</Table.Head>
				<Table.Head>Status</Table.Head>
				<Table.Head>Location</Table.Head>
				<Table.Head>Mentor</Table.Head>
				<Table.Head class="w-min">Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#if loading}
				<Table.Row>
					<Table.Cell colspan={7} class="text-muted-foreground text-center italic">
						Loading tickets...
					</Table.Cell>
				</Table.Row>
			{:else if tickets.length > 0}
				{#each tickets as ticket (ticket.id)}
					<Table.Row>
						<Table.Cell class="font-medium">
							{ticket.teamName ?? 'Unknown'}
						</Table.Cell>
						<Table.Cell>{ticket.title}</Table.Cell>
						<Table.Cell>
							<a
								href={`https://github.com/${clientEnv.PUBLIC_GITHUB_ORGNAME}/${ticket.repository}/issues/${ticket.issueNumber}`}
								target="_blank"
								class={buttonVariants({
									variant: 'link',
									class: 'inline-flex items-center gap-1 px-0'
								})}
							>
								<GithubIcon class="fill-primary size-4!" />
								{ticket.repository}#{ticket.issueNumber}
							</a>
						</Table.Cell>
						<Table.Cell>
							<TicketStatusBadge status={ticket.resolutionStatus} />
						</Table.Cell>
						<Table.Cell>
							{#if ticket.teamRoom}
								<span class="text-sm">{ticket.teamRoom}</span>
								{#if ticket.teamLocationDescription}
									<span class="text-muted-foreground block text-xs"
										>{ticket.teamLocationDescription}</span
									>
								{/if}
							{:else}
								<span class="text-muted-foreground text-sm">--</span>
							{/if}
						</Table.Cell>
						<Table.Cell>
							{ticket.assignedMentorName ?? 'Unassigned'}
						</Table.Cell>
						<Table.Cell>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									{#snippet child({ props })}
										<Button variant="ghost" size="icon" {...props}>
											<EllipsisVertical class="size-4" />
										</Button>
									{/snippet}
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end">
									{#if ticket.resolutionStatus === 'open'}
										<DropdownMenu.Item
											onclick={() => handleClaim(ticket.id)}
											disabled={claimMutation.isPending}
										>
											Claim Ticket
										</DropdownMenu.Item>
									{/if}
									{#if ticket.resolutionStatus === 'claimed'}
										<DropdownMenu.Item
											onclick={() => handleStatusChange(ticket.id, 'inProgress')}
											disabled={updateStatusMutation.isPending}
										>
											Mark In Progress
										</DropdownMenu.Item>
									{/if}
									{#if ticket.resolutionStatus === 'inProgress'}
										<DropdownMenu.Item
											onclick={() => handleStatusChange(ticket.id, 'resolved')}
											disabled={updateStatusMutation.isPending}
										>
											Mark Resolved
										</DropdownMenu.Item>
									{/if}
									{#if ticket.resolutionStatus !== 'open'}
										<DropdownMenu.Item
											onclick={() => handleStatusChange(ticket.id, 'open')}
											disabled={updateStatusMutation.isPending}
										>
											Reopen Ticket
										</DropdownMenu.Item>
									{/if}
									<DropdownMenu.Separator />
									<DropdownMenu.Item>
										<a
											href={`https://github.com/${clientEnv.PUBLIC_GITHUB_ORGNAME}/${ticket.repository}/issues/${ticket.issueNumber}`}
											target="_blank"
											class="w-full"
										>
											View Issue on GitHub
										</a>
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</Table.Cell>
					</Table.Row>
				{/each}
			{:else}
				<Table.Row>
					<Table.Cell colspan={7} class="text-muted-foreground text-center italic">
						No tickets found.
					</Table.Cell>
				</Table.Row>
			{/if}
		</Table.Body>
	</Table.Root>
{/snippet}
