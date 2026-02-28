import type { ColumnDef } from '@tanstack/table-core';
import type { RouterOutputs } from '$lib/orpc/server';

export type TicketRow = RouterOutputs['tickets']['allTickets']['tickets'][number];

export const columns: ColumnDef<TicketRow>[] = [
	{
		id: 'team',
		accessorFn: (row) => row.teamName ?? '',
		header: 'Team',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		id: 'title',
		accessorFn: (row) => row.title,
		header: 'Title',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		id: 'issue',
		accessorFn: (row) => `${row.repository}#${row.issueNumber}`,
		header: 'Issue',
		enableSorting: false,
		enableColumnFilter: false
	},
	{
		id: 'status',
		accessorFn: (row) => row.resolutionStatus,
		header: 'Status',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		id: 'location',
		accessorFn: (row) => row.teamRoom ?? '',
		header: 'Location',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		id: 'mentor',
		accessorFn: (row) => row.assignedMentorName ?? '',
		header: 'Mentor',
		enableSorting: true,
		enableColumnFilter: true
	},
	{
		id: 'created',
		accessorFn: (row) => row.createdAt,
		header: 'Created',
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
