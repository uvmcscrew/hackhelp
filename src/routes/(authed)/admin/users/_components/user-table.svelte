<script lang="ts">
	import * as DataTable from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
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
	import { columns, type UserRow } from './columns';

	type Props = {
		users: UserRow[];
	};

	let { users }: Props = $props();

	let globalFilter = $state('');
	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);

	const table = createSvelteTable({
		get data() {
			return users;
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

	function formatDate(date: Date | string | null | undefined): string {
		if (!date) return '—';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getRoleBadgeVariant(role: string | null | undefined) {
		if (!role) return 'secondary' as const;
		if (role.includes('admin')) return 'default' as const;
		return 'outline' as const;
	}
</script>

<div class="space-y-4">
	<!-- Toolbar -->
	<div class="flex items-center gap-2">
		<Input
			placeholder="Search users..."
			value={globalFilter}
			oninput={(e) => (globalFilter = (e.target as HTMLInputElement).value)}
			class="max-w-sm"
		/>
		{#if globalFilter}
			<Button variant="ghost" size="sm" onclick={() => (globalFilter = '')}>Clear</Button>
		{/if}
		<span class="text-muted-foreground ml-auto text-sm">
			{table.getFilteredRowModel().rows.length} of {users.length} user{users.length === 1
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
												<span class="text-xs">↑</span>
											{:else if header.column.getIsSorted() === 'desc'}
												<span class="text-xs">↓</span>
											{:else}
												<span class="text-muted-foreground text-xs">↕</span>
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
					<Table.Row>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell>
								{#if cell.column.id === 'banned'}
									{@const banned = cell.getValue() as boolean | null}
									{#if banned}
										<Badge variant="destructive" hoverEffects={false}>Banned</Badge>
									{:else}
										<Badge variant="green" hoverEffects={false}>Active</Badge>
									{/if}
								{:else if cell.column.id === 'role'}
									{@const role = cell.getValue() as string | null | undefined}
									{#if role}
										{#each role.split(',') as r (r)}
											<Badge
												variant={getRoleBadgeVariant(r.trim())}
												hoverEffects={false}
												class="mr-1"
											>
												{r.trim()}
											</Badge>
										{/each}
									{:else}
										<span class="text-muted-foreground text-sm">—</span>
									{/if}
								{:else if cell.column.id === 'createdAt'}
									<span class="text-muted-foreground text-sm">
										{formatDate(cell.getValue() as Date | null)}
									</span>
								{:else if cell.column.id === 'username'}
									{@const username = cell.getValue() as string | null}
									{#if username}
										<span class="font-mono text-sm">@{username}</span>
									{:else}
										<span class="text-muted-foreground text-sm">—</span>
									{/if}
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
							No users found.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
