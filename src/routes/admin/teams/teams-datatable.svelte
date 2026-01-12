<script lang="ts" generics="TData, TValue">
	/* eslint-disable @typescript-eslint/no-unused-vars */
	import type { Team, User } from '$lib/server/db/schema';
	import * as DataTable from '$lib/components/ui/data-table';
	import { getCoreRowModel, type ColumnDef } from '@tanstack/table-core';
	import * as Table from '$lib/components/ui/table';
	import { createSvelteTable } from '$lib/components/ui/data-table';
	type Props = {
		teams: Team[];
	};

	export const columns = [
		{
			accessorKey: 'name',
			header: 'Name'
		},
		{
			accessorKey: 'githubSlug',
			header: 'Slug'
		},
		{
			accessorKey: 'id',
			header: 'ID'
		}
	] satisfies ColumnDef<Team>[];

	type DataTableProps<TData, TValue> = {
		data: TData[];
	};

	let { data }: DataTableProps<TData, TValue> = $props();

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		getCoreRowModel: getCoreRowModel()
	});
</script>

<div class="rounded-md border">
	<Table.Root>
		<Table.Header>
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row>
					{#each headerGroup.headers as header (header.id)}
						<Table.Head>
							{#if !header.isPlaceholder}
								<DataTable.FlexRender
									content={header.column.columnDef.header}
									context={header.getContext()}
								/>
							{/if}
						</Table.Head>
					{/each}
				</Table.Row>
			{/each}
		</Table.Header>
		<Table.Body>
			{#each table.getRowModel().rows as row (row.id)}
				<Table.Row data-state={row.getIsSelected() && 'selected'}>
					{#each row.getVisibleCells() as cell (cell.id)}
						<Table.Cell>
							<DataTable.FlexRender
								content={cell.column.columnDef.cell}
								context={cell.getContext()}
							/>
						</Table.Cell>
					{/each}
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
