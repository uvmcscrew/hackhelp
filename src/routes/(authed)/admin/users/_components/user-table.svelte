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
	import { columns, type UserRow } from './columns';

	type Props = {
		users: UserRow[];
	};

	let { users }: Props = $props();

	const qc = useQueryClient();

	const invalidateUsers = () =>
		qc.invalidateQueries({ queryKey: orpc.admin.users.all.queryOptions().queryKey });

	const grantVerifiedMutation = createMutation(() =>
		orpc.admin.users.grantVerified.mutationOptions({ onSuccess: invalidateUsers })
	);
	const grantJudgeMutation = createMutation(() =>
		orpc.admin.users.grantJudge.mutationOptions({ onSuccess: invalidateUsers })
	);
	const grantMentorMutation = createMutation(() =>
		orpc.admin.users.grantMentor.mutationOptions({ onSuccess: invalidateUsers })
	);

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

	function getRoleBadgeVariant(role: string) {
		if (role === 'admin') return 'default' as const;
		if (role === 'mentor') return 'blue' as const;
		if (role === 'judge') return 'yellow' as const;
		if (role === 'verifiedUser') return 'green' as const;
		return 'secondary' as const;
	}

	function getPrimaryRoleBadgeVariant(role: string | null) {
		if (!role) return 'outline' as const;
		if (role === 'admin') return 'default' as const;
		if (role === 'mentor') return 'blue' as const;
		if (role === 'judge') return 'yellow' as const;
		return 'secondary' as const; // competitor
	}

	function hasRole(roleString: string | null | undefined, role: string) {
		if (!roleString) return false;
		return roleString
			.split(',')
			.map((r) => r.trim())
			.includes(role);
	}

	// Whether any mutation for a given userId is currently pending
	function isMutating(userId: string) {
		const vars = [
			grantVerifiedMutation.variables,
			grantJudgeMutation.variables,
			grantMentorMutation.variables
		];
		return (
			(grantVerifiedMutation.isPending ||
				grantJudgeMutation.isPending ||
				grantMentorMutation.isPending) &&
			vars.some((v) => v?.userId === userId)
		);
	}
</script>

<!-- eslint-disable @typescript-eslint/no-unsafe-argument -->
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
					{@const rowData = row.original}
					<Table.Row>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell>
								{#if cell.column.id === 'name'}
									<span class="font-medium">{rowData.user.name}</span>
								{:else if cell.column.id === 'email'}
									<span class="text-muted-foreground text-sm">{rowData.user.email}</span>
								{:else if cell.column.id === 'role'}
									{@const roleStr = rowData.user.role}
									{#if roleStr}
										{#each roleStr.split(',') as r (r)}
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
								{:else if cell.column.id === 'primaryRole'}
									{@const primaryRole = rowData.profile?.primaryRole ?? null}
									{#if primaryRole}
										<Badge variant={getPrimaryRoleBadgeVariant(primaryRole)} hoverEffects={false}>
											{primaryRole}
										</Badge>
									{:else}
										<span class="text-muted-foreground text-sm">—</span>
									{/if}
								{:else if cell.column.id === 'profileInitialized'}
									{#if rowData.profile !== null}
										<Badge variant="green" hoverEffects={false}>Yes</Badge>
									{:else}
										<Badge variant="secondary" hoverEffects={false}>No</Badge>
									{/if}
								{:else if cell.column.id === 'banned'}
									{#if rowData.user.banned}
										<Badge variant="destructive" hoverEffects={false}>Banned</Badge>
									{:else}
										<Badge variant="green" hoverEffects={false}>Active</Badge>
									{/if}
								{:else if cell.column.id === 'createdAt'}
									<span class="text-muted-foreground text-sm">
										{formatDate(rowData.user.createdAt)}
									</span>
								{:else if cell.column.id === 'actions'}
									{@const userId = rowData.user.id}
									{@const roles = rowData.user.role ?? ''}
									{@const pending = isMutating(userId)}
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											{#snippet child({ props })}
												<Button variant="outline" size="sm" disabled={pending} {...props}>
													Actions
												</Button>
											{/snippet}
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											{#if !hasRole(roles, 'verifiedUser')}
												<DropdownMenu.Item onclick={() => grantVerifiedMutation.mutate({ userId })}>
													Grant Verified
												</DropdownMenu.Item>
											{/if}
											{#if !hasRole(roles, 'judge')}
												<DropdownMenu.Item onclick={() => grantJudgeMutation.mutate({ userId })}>
													Make Judge
												</DropdownMenu.Item>
											{/if}
											{#if !hasRole(roles, 'mentor')}
												<DropdownMenu.Item onclick={() => grantMentorMutation.mutate({ userId })}>
													Make Mentor
												</DropdownMenu.Item>
											{/if}
											{#if hasRole(roles, 'verifiedUser') && hasRole(roles, 'judge') && hasRole(roles, 'mentor')}
												<DropdownMenu.Item disabled>All roles granted</DropdownMenu.Item>
											{/if}
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
							No users found.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
