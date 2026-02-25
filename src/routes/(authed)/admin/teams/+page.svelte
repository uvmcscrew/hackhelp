<svelte:options runes={true} />

<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { Button } from '$lib/components/ui/button';
	import TeamsTable from './_components/teams-table.svelte';

	const teamsQuery = createQuery(() => orpc.admin.teams.all.queryOptions());
</script>

<svelte:head>
	<title>Teams Administration | HackHelp</title>
</svelte:head>

<div class="container mx-auto py-8">
	<div class="mb-6 flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold">Teams</h1>
			<p class="text-muted-foreground text-sm">Manage all teams.</p>
		</div>
		<Button href="/admin/teams/create">Create Team</Button>
	</div>

	<TeamsTable teams={teamsQuery.data?.teams || []} />
</div>
