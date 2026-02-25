import type { ColumnDef } from '@tanstack/table-core';
import type { RouterOutputs } from '$lib/orpc/server';

export type TeamRow = RouterOutputs['admin']['teams']['all']['teams'][number];

export const columns: ColumnDef<TeamRow>[] = [
	{
		id: 'name',
		accessorFn: (row) => row.team.name,
		header: 'Name',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		id: 'memberCount',
		accessorFn: (row) => row.memberCount,
		header: 'Members',
		enableSorting: true,
		enableColumnFilter: false
	},
	{
		id: 'challenge',
		accessorFn: (row) => row.challengeName ?? null,
		header: 'Challenge',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		id: 'joinCode',
		accessorFn: (row) => row.team.joinCode,
		header: 'Join Code',
		enableSorting: false,
		enableColumnFilter: false
	},
	{
		id: 'canJoin',
		accessorFn: (row) => row.team.canJoin,
		header: 'Joinable',
		enableSorting: true,
		enableColumnFilter: false
	},
	{
		id: 'isPublic',
		accessorFn: (row) => row.team.isPublic,
		header: 'Public',
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
