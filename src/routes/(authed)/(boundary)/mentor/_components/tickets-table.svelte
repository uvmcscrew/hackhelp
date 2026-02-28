<script lang="ts">
	import * as DataTable from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import { Input } from '$lib/components/ui/input';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { createSvelteTable } from '$lib/components/ui/data-table';
	import {
		getCoreRowModel,
		getFilteredRowModel,
		getSortedRowModel,
		type ColumnFiltersState,
		type SortingState
	} from '@tanstack/table-core';
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { clientEnv } from '$lib/env/client';
	import { columns, type TicketRow } from './columns';
	import TicketStatusBadge from '$lib/components/ticket-status-badge.svelte';
	import { MarkGithub24 as GithubIcon } from 'svelte-octicons';
	import HandIcon from 'lucide-svelte/icons/hand';
	import PlayIcon from 'lucide-svelte/icons/play';
	import CheckCircleIcon from 'lucide-svelte/icons/check-circle';
	import RotateCcwIcon from 'lucide-svelte/icons/rotate-ccw';
	import ExternalLinkIcon from 'lucide-svelte/icons/external-link';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import type { TicketResolutionStatus } from '$lib/server/db/schema';

	type Props = {
		tickets: TicketRow[];
	};

	let { tickets }: Props = $props();

	const qc = useQueryClient();

	async function invalidateTickets() {
		await qc.invalidateQueries({ queryKey: orpc.tickets.allTickets.queryKey() });
		await qc.invalidateQueries({ queryKey: orpc.tickets.myAssignedTickets.queryKey() });
	}

	const claimMutation = createMutation(() =>
		orpc.tickets.claimTicket.mutationOptions({
			onSuccess: invalidateTickets
		})
	);

	const updateStatusMutation = createMutation(() =>
		orpc.tickets.updateStatus.mutationOptions({
			onSuccess: invalidateTickets
		})
	);

	function handleClaim(ticketId: string) {
		claimMutation.mutate({ ticketId });
	}

	function handleStatusChange(ticketId: string, status: TicketResolutionStatus) {
		updateStatusMutation.mutate({ ticketId, status });
	}

	function isMutating(ticketId: string) {
		return (
			(claimMutation.isPending && claimMutation.variables?.ticketId === ticketId) ||
			(updateStatusMutation.isPending && updateStatusMutation.variables?.ticketId === ticketId)
		);
	}

	let globalFilter = $state('');
	let sorting = $state<SortingState>([{ id: 'created', desc: true }]);
	let columnFilters = $state<ColumnFiltersState>([]);

	const table = createSvelteTable({
		get data() {
			return tickets;
		},
		columns,
		state: {
			get globalFilter() {
				return globalFilter;
			},
			get sorting() {
				return sorting;
			},
			get columnFilters() {
				return columnFilters;
			}
		},
		onSortingChange: (updater) => {
			if (typeof updater === 'function') sorting = updater(sorting);
			else sorting = updater;
		},
		onColumnFiltersChange: (updater) => {
			if (typeof updater === 'function') columnFilters = updater(columnFilters);
			else columnFilters = updater;
		},
		onGlobalFilterChange: (updater) => {
			if (typeof updater === 'function') globalFilter = updater(globalFilter);
			else globalFilter = updater;
		},
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel()
	});
</script>

<div class="space-y-4">
	<!-- Toolbar -->
	<div class="flex items-center gap-2">
		<Input
			placeholder="Search tickets..."
			value={globalFilter}
			oninput={(e) => (globalFilter = (e.target as HTMLInputElement).value)}
			class="max-w-sm"
		/>
		{#if globalFilter}
			<Button variant="ghost" size="sm" onclick={() => (globalFilter = '')}>Clear</Button>
		{/if}
		<span class="text-muted-foreground ml-auto text-sm">
			{table.getFilteredRowModel().rows.length} of {tickets.length} ticket{tickets.length === 1
				? ''
				: 's'}
		</span>
	</div>

	<!-- Table -->
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head>
								{#if !header.isPlaceholder}
									{#if header.column.getCanSort()}
										<button
											class="flex cursor-pointer items-center gap-1 font-medium select-none"
											onclick={header.column.getToggleSortingHandler()}
										>
											<DataTable.FlexRender
												content={header.column.columnDef.header}
												context={header.getContext()}
											/>
											{#if header.column.getIsSorted() === 'asc'}
												<span class="text-xs">^</span>
											{:else if header.column.getIsSorted() === 'desc'}
												<span class="text-xs">v</span>
											{:else}
												<span class="text-muted-foreground text-xs">~</span>
											{/if}
										</button>
									{:else}
										<DataTable.FlexRender
											content={header.column.columnDef.header}
											context={header.getContext()}
										/>
									{/if}
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#each table.getRowModel().rows as row (row.id)}
					{@const rowData = row.original}
					<Table.Row>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell>
								{#if cell.column.id === 'team'}
									<span class="font-medium">{rowData.teamName ?? 'Unknown'}</span>
								{:else if cell.column.id === 'title'}
									<span>{rowData.title}</span>
								{:else if cell.column.id === 'issue'}
									<a
										href={`https://github.com/${clientEnv.PUBLIC_GITHUB_ORGNAME}/${rowData.repository}/issues/${rowData.issueNumber}`}
										target="_blank"
										class={buttonVariants({
											variant: 'link',
											class: 'inline-flex items-center gap-1 px-0'
										})}
									>
										<GithubIcon class="fill-primary size-4!" />
										{rowData.repository}#{rowData.issueNumber}
									</a>
								{:else if cell.column.id === 'status'}
									<TicketStatusBadge status={rowData.resolutionStatus} />
								{:else if cell.column.id === 'location'}
									{#if rowData.teamRoom}
										<span class="text-sm">{rowData.teamRoom}</span>
										{#if rowData.teamLocationDescription}
											<span class="text-muted-foreground block text-xs"
												>{rowData.teamLocationDescription}</span
											>
										{/if}
									{:else}
										<span class="text-muted-foreground text-sm">--</span>
									{/if}
								{:else if cell.column.id === 'mentor'}
									<span>{rowData.assignedMentorName ?? 'Unassigned'}</span>
								{:else if cell.column.id === 'created'}
									<span class="text-muted-foreground text-sm">
										{new Date(rowData.createdAt).toLocaleTimeString([], {
											hour: '2-digit',
											minute: '2-digit'
										})}
									</span>
								{:else if cell.column.id === 'actions'}
									{@const pending = isMutating(rowData.id)}
									<div class="flex items-center gap-0.5">
										{#if pending}
											<LoaderCircle class="size-4 animate-spin" />
										{:else}
											{#if rowData.resolutionStatus === 'open'}
												<Button
													variant="ghost"
													size="icon"
													class="size-7"
													onclick={() => handleClaim(rowData.id)}
													aria-label="Claim ticket"
												>
													<HandIcon class="size-4" />
												</Button>
											{/if}
											{#if rowData.resolutionStatus === 'claimed'}
												<Button
													variant="ghost"
													size="icon"
													class="size-7"
													onclick={() => handleStatusChange(rowData.id, 'inProgress')}
													aria-label="Mark in progress"
												>
													<PlayIcon class="size-4" />
												</Button>
											{/if}
											{#if rowData.resolutionStatus === 'inProgress'}
												<Button
													variant="ghost"
													size="icon"
													class="size-7"
													onclick={() => handleStatusChange(rowData.id, 'resolved')}
													aria-label="Mark resolved"
												>
													<CheckCircleIcon class="size-4" />
												</Button>
											{/if}
											{#if rowData.resolutionStatus !== 'open'}
												<Button
													variant="ghost"
													size="icon"
													class="size-7"
													onclick={() => handleStatusChange(rowData.id, 'open')}
													aria-label="Reopen ticket"
												>
													<RotateCcwIcon class="size-4" />
												</Button>
											{/if}
											<Button
												variant="ghost"
												size="icon"
												class="size-7"
												href={`https://github.com/${clientEnv.PUBLIC_GITHUB_ORGNAME}/${rowData.repository}/issues/${rowData.issueNumber}`}
												target="_blank"
												aria-label="View issue on GitHub"
											>
												<ExternalLinkIcon class="size-4" />
											</Button>
										{/if}
									</div>
								{:else}
									<DataTable.FlexRender
										content={cell.column.columnDef.cell}
										context={cell.getContext()}
									/>
								{/if}
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={columns.length} class="h-24 text-center">
							No tickets found.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
