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
	import { capitalize } from 'es-toolkit/string';
	import Upload from 'lucide-svelte/icons/upload';

	type Props = {
		users: UserRow[];
	};

	let { users }: Props = $props();

	const qc = useQueryClient();

	const invalidateUsers = () =>
		qc.invalidateQueries({ queryKey: orpc.admin.users.all.queryOptions().queryKey });

	const grantRoleMutation = createMutation(() =>
		orpc.admin.users.grantRole.mutationOptions({ onSuccess: invalidateUsers })
	);
	const removeRoleMutation = createMutation(() =>
		orpc.admin.users.removeRole.mutationOptions({ onSuccess: invalidateUsers })
	);

	const grantVerifiedMutation = createMutation(() =>
		orpc.admin.users.grantVerified.mutationOptions({ onSuccess: invalidateUsers })
	);

	const deleteUserMutation = createMutation(() =>
		orpc.admin.users.deleteUser.mutationOptions({ onSuccess: invalidateUsers })
	);

	const importUsersMutation = createMutation(() =>
		orpc.admin.users.importUsers.mutationOptions({ onSuccess: invalidateUsers })
	);

	// CSV import state
	let fileInput = $state<HTMLInputElement | null>(null);
	let importResult = $state<{ created: number; skipped: number; total: number } | null>(null);

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			const text = reader.result as string;
			const parsed = parseCsv(text);
			if (parsed.length === 0) {
				alert('No valid rows found in CSV. Ensure it has "name" and "email" columns.');
				return;
			}
			importUsersMutation.mutate(
				{ users: parsed },
				{
					onSuccess: (data) => {
						importResult = data;
					}
				}
			);
		};
		reader.readAsText(file);
		// Reset so the same file can be re-selected
		input.value = '';
	}

	function parseCsv(text: string): Array<{ name: string; email: string }> {
		const lines = text.split(/\r?\n/).filter((l) => l.trim());
		if (lines.length < 2) return [];

		const headerLine = lines[0].toLowerCase();
		const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
		const nameIdx = headers.indexOf('name');
		const emailIdx = headers.indexOf('email');

		if (nameIdx === -1 || emailIdx === -1) return [];

		const results: Array<{ name: string; email: string }> = [];
		for (let i = 1; i < lines.length; i++) {
			const cols = parseCsvLine(lines[i]);
			const name = cols[nameIdx]?.trim();
			const email = cols[emailIdx]?.trim();
			if (name && email && email.includes('@')) {
				results.push({ name, email });
			}
		}
		return results;
	}

	function parseCsvLine(line: string): string[] {
		const result: string[] = [];
		let current = '';
		let inQuotes = false;
		for (let i = 0; i < line.length; i++) {
			const ch = line[i];
			if (inQuotes) {
				if (ch === '"' && line[i + 1] === '"') {
					current += '"';
					i++;
				} else if (ch === '"') {
					inQuotes = false;
				} else {
					current += ch;
				}
			} else {
				if (ch === '"') {
					inQuotes = true;
				} else if (ch === ',') {
					result.push(current);
					current = '';
				} else {
					current += ch;
				}
			}
		}
		result.push(current);
		return result;
	}

	// Delete confirmation
	let confirmDeleteUserId = $state<string | null>(null);

	function handleDelete(userId: string) {
		if (confirmDeleteUserId === userId) {
			deleteUserMutation.mutate({ userId });
			confirmDeleteUserId = null;
		} else {
			confirmDeleteUserId = userId;
		}
	}

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
			grantRoleMutation.variables,
			deleteUserMutation.variables
		];
		return (
			(grantVerifiedMutation.isPending ||
				grantRoleMutation.isPending ||
				deleteUserMutation.isPending) &&
			vars.some((v) => v?.userId === userId)
		);
	}
</script>

<!-- eslint-disable @typescript-eslint/no-unsafe-argument -->
<div class="space-y-4">
	<!-- Import result banner -->
	{#if importResult}
		<div class="bg-muted flex items-center justify-between rounded-md border px-4 py-3 text-sm">
			<span>
				Imported <strong>{importResult.created}</strong> user{importResult.created === 1
					? ''
					: 's'}, skipped <strong>{importResult.skipped}</strong> duplicate{importResult.skipped ===
				1
					? ''
					: 's'} (of {importResult.total} rows).
			</span>
			<Button variant="ghost" size="sm" onclick={() => (importResult = null)}>Dismiss</Button>
		</div>
	{/if}
	{#if importUsersMutation.isError}
		<div class="bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
			Import failed: {importUsersMutation.error.message}
		</div>
	{/if}

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
		<input
			bind:this={fileInput}
			type="file"
			accept=".csv"
			class="hidden"
			onchange={handleFileSelect}
		/>
		<Button
			variant="outline"
			size="sm"
			onclick={() => fileInput?.click()}
			disabled={importUsersMutation.isPending}
		>
			<Upload class="mr-2 h-4 w-4" />
			{importUsersMutation.isPending ? 'Importing...' : 'Import CSV'}
		</Button>
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
										{#each roleStr.split(',').filter((r) => r !== 'user') as r (r)}
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
								{:else if cell.column.id === 'hasGithub'}
									{#if rowData.hasGithub}
										<Badge variant="green" hoverEffects={false}>Linked</Badge>
									{:else}
										<span class="text-muted-foreground text-sm">—</span>
									{/if}
								{:else if cell.column.id === 'hasMlh'}
									{#if rowData.hasMlh}
										<Badge variant="green" hoverEffects={false}>Linked</Badge>
									{:else}
										<span class="text-muted-foreground text-sm">—</span>
									{/if}
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
											<DropdownMenu.Item class="w-full hover:cursor-pointer">
												{#snippet child({ props })}
													<a {...props} href={`/admin/users/${userId}`}>View Details</a>
												{/snippet}
											</DropdownMenu.Item>
											<DropdownMenu.Separator />
											{#if !hasRole(roles, 'verifiedUser')}
												<DropdownMenu.Item onclick={() => grantVerifiedMutation.mutate({ userId })}>
													Grant Verified
												</DropdownMenu.Item>
											{/if}
											{#each ['judge', 'mentor', 'admin'] as const as role (role)}
												{@const ucase = capitalize(role)}
												{#if hasRole(roles, role)}
													<DropdownMenu.Item
														onclick={() => removeRoleMutation.mutate({ userId, role })}
													>
														Remove {ucase}
													</DropdownMenu.Item>
												{:else}
													<DropdownMenu.Item
														onclick={() => grantRoleMutation.mutate({ userId, role })}
													>
														Make {ucase}
													</DropdownMenu.Item>
												{/if}
											{/each}
											<DropdownMenu.Separator />
											<DropdownMenu.Item
												class="text-destructive"
												onclick={() => handleDelete(userId)}
											>
												{confirmDeleteUserId === userId ? 'Confirm Delete?' : 'Delete User'}
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
							No users found.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
