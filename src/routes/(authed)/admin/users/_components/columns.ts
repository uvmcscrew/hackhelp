import type { ColumnDef } from '@tanstack/table-core';
import type { RouterOutputs } from '$lib/orpc/server';

// The row type is the joined user + profile from our oRPC endpoint
export type UserRow = RouterOutputs['admin']['users']['all']['users'][number];

export const columns: ColumnDef<UserRow>[] = [
	{
		id: 'name',
		accessorFn: (row) => row.user.name,
		header: 'Name',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		id: 'email',
		accessorFn: (row) => row.user.email,
		header: 'Email',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		id: 'role',
		accessorFn: (row) => row.user.role,
		header: 'Roles',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		id: 'primaryRole',
		accessorFn: (row) => row.profile?.primaryRole ?? null,
		header: 'Primary Role',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		id: 'profileInitialized',
		accessorFn: (row) => row.profile !== null,
		header: 'Profile',
		enableSorting: true,
		enableColumnFilter: false
	},
	{
		id: 'banned',
		accessorFn: (row) => row.user.banned,
		header: 'Status',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		id: 'hasGithub',
		accessorFn: (row) => row.hasGithub,
		header: 'GitHub',
		enableSorting: true,
		enableColumnFilter: false
	},
	{
		id: 'hasMlh',
		accessorFn: (row) => row.hasMlh,
		header: 'MLH',
		enableSorting: true,
		enableColumnFilter: false
	},
	{
		id: 'createdAt',
		accessorFn: (row) => row.user.createdAt,
		header: 'Joined',
		enableSorting: true,
		enableColumnFilter: false
	},
	{
		id: 'actions',
		header: 'Actions',
		enableSorting: false,
		enableColumnFilter: false
	}
];
