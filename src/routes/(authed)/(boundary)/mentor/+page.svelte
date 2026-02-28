<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Select from '$lib/components/ui/select';
	import TicketsTable from './_components/tickets-table.svelte';
	import type { TicketResolutionStatus } from '$lib/server/db/schema';

	// ─── Filter State ────────────────────────────────────────────────────
	let statusFilter = $state<TicketResolutionStatus | 'all'>('all');

	// ─── Queries ─────────────────────────────────────────────────────────
	const allTicketsQuery = createQuery(() =>
		orpc.tickets.allTickets.queryOptions({
			input: statusFilter === 'all' ? undefined : { status: statusFilter }
		})
	);

	const myTicketsQuery = createQuery(() => orpc.tickets.myAssignedTickets.queryOptions());
</script>

<svelte:head>
	<title>Mentor Dashboard</title>
</svelte:head>

<div class="container mx-auto py-8">
	<div class="mb-6 flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold">Tickets</h1>
			<p class="text-muted-foreground text-sm">Manage help requests from teams.</p>
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
	</div>

	<Tabs.Root value="all">
		<Tabs.List>
			<Tabs.Trigger value="all">
				All Tickets ({allTicketsQuery.data?.tickets.length ?? 0})
			</Tabs.Trigger>
			<Tabs.Trigger value="mine">
				My Tickets ({myTicketsQuery.data?.tickets.length ?? 0})
			</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="all" class="mt-4">
			<TicketsTable tickets={allTicketsQuery.data?.tickets ?? []} />
		</Tabs.Content>

		<Tabs.Content value="mine" class="mt-4">
			<TicketsTable tickets={myTicketsQuery.data?.tickets ?? []} />
		</Tabs.Content>
	</Tabs.Root>
</div>
