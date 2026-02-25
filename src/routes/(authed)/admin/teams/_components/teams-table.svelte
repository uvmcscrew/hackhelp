<script lang="ts">
	import * as DataTable from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
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
	import { columns, type TeamRow } from './columns';

	type Props = {
		teams: TeamRow[];
	};

	let { teams }: Props = $props();

	const qc = useQueryClient();

	const invalidateTeams = () =>
		qc.invalidateQueries({ queryKey: orpc.admin.teams.all.queryOptions().queryKey });

	const deleteTeamMutation = createMutation(() =>
		orpc.admin.teams.deleteTeam.mutationOptions({ onSuccess: invalidateTeams })
	);

	const toggleCanJoinMutation = createMutation(() =>
		orpc.admin.teams.toggleCanJoin.mutationOptions({ onSuccess: invalidateTeams })
	);

	let globalFilter = $state('');
	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);

	const table = createSvelteTable({
		get data() {
			return teams;
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

	function isMutating(teamId: string) {
		return (
			(deleteTeamMutation.isPending && deleteTeamMutation.variables?.teamId === teamId) ||
			(toggleCanJoinMutation.isPending && toggleCanJoinMutation.variables?.teamId === teamId)
		);
	}
</script>

<div class="space-y-4">
	<!-- Toolbar -->
	<div class="flex items-center gap-2">
		<Input
			placeholder="Search teams..."
			value={globalFilter}
			oninput={(e) => (globalFilter = (e.target as HTMLInputElement).value)}
			class="max-w-sm"
		/>
		{#if globalFilter}
			<Button variant="ghost" size="sm" onclick={() => (globalFilter = '')}>Clear</Button>
		{/if}
		<span class="text-muted-foreground ml-auto text-sm">
			{table.getFilteredRowModel().rows.length} of {teams.length} team{teams.length === 1
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
								{#if cell.column.id === 'name'}
									<a href={`/admin/teams/${rowData.team.id}`} class="font-medium hover:underline">
										{rowData.team.name}
									</a>
								{:else if cell.column.id === 'memberCount'}
									<span>{rowData.memberCount}</span>
								{:else if cell.column.id === 'challenge'}
									{#if rowData.challengeName}
										<span>{rowData.challengeName}</span>
									{:else}
										<span class="text-muted-foreground text-sm">--</span>
									{/if}
								{:else if cell.column.id === 'joinCode'}
									<code class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
										{rowData.team.joinCode}
									</code>
								{:else if cell.column.id === 'canJoin'}
									{#if rowData.team.canJoin}
										<Badge variant="green" hoverEffects={false}>Open</Badge>
									{:else}
										<Badge variant="secondary" hoverEffects={false}>Closed</Badge>
									{/if}
								{:else if cell.column.id === 'isPublic'}
									{#if rowData.team.isPublic}
										<Badge variant="green" hoverEffects={false}>Yes</Badge>
									{:else}
										<Badge variant="secondary" hoverEffects={false}>No</Badge>
									{/if}
								{:else if cell.column.id === 'actions'}
									{@const teamId = rowData.team.id}
									{@const pending = isMutating(teamId)}
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											{#snippet child({ props })}
												<Button variant="outline" size="sm" disabled={pending} {...props}>
													Actions
												</Button>
											{/snippet}
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Item class="w-full hover:cursor-pointer">
												{#snippet child({ props })}
													<a {...props} href={`/admin/teams/${teamId}`}>Manage</a>
												{/snippet}
											</DropdownMenu.Item>
											<DropdownMenu.Separator />
											{#if rowData.team.canJoin}
												<DropdownMenu.Item
													onclick={() => toggleCanJoinMutation.mutate({ teamId, canJoin: false })}
												>
													Close Joining
												</DropdownMenu.Item>
											{:else}
												<DropdownMenu.Item
													onclick={() => toggleCanJoinMutation.mutate({ teamId, canJoin: true })}
												>
													Open Joining
												</DropdownMenu.Item>
											{/if}
											<DropdownMenu.Separator />
											<DropdownMenu.Item
												class="text-destructive"
												onclick={() => {
													if (confirm(`Delete team "${rowData.team.name}"?`)) {
														deleteTeamMutation.mutate({ teamId });
													}
												}}
											>
												Delete Team
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
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
							No teams found.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
