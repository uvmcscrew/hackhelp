import type { ColumnDef } from '@tanstack/table-core';
import type { UserWithRole } from 'better-auth/plugins/admin';

export type UserRow = UserWithRole;

export const columns: ColumnDef<UserRow>[] = [
	{
		accessorKey: 'name',
		header: 'Name',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		accessorKey: 'email',
		header: 'Email',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		accessorKey: 'username',
		header: 'Username',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		accessorKey: 'role',
		header: 'Role',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		accessorKey: 'banned',
		header: 'Status',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		accessorKey: 'createdAt',
		header: 'Joined',
		enableSorting: true,
		enableColumnFilter: false
	}
];
