<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Table from '$lib/components/ui/table';
	import queries from '$lib/trpc/client/queries.svelte';
	import type { RouterOutputs } from '$lib/trpc/server';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	// import UserTableDropdown from './user-table-dropdown.svelte';

	type TeamsData = RouterOutputs['admin']['teams']['all'];

	type Props = {
		teams: TeamsData;
	};

	let props: Props = $props();

	let users = queries.adminGetAllTeams(props.teams);
</script>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-min">Name</Table.Head>
			<Table.Head class="w-[100px]">Members</Table.Head>
			<Table.Head />
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#if $users.data}
			{#each $users.data.teams as team}
				<Table.Row>
					<Table.Cell class="font-medium">{team.name}</Table.Cell>
					<Table.Cell>0</Table.Cell>
					<Table.Cell
						><Button href="/admin/teams/${team.id}">View <ArrowRight class="ml-1 h-6 w-6" /></Button
						></Table.Cell
					>
				</Table.Row>
			{/each}
		{/if}
	</Table.Body>
</Table.Root>
