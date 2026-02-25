<svelte:options runes={true} />

<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import TeamsTable from './_components/teams-table.svelte';

	const teamsQuery = createQuery(() => orpc.admin.teams.all.queryOptions());
</script>

<div class="container mx-auto py-8">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Teams</h1>
		<p class="text-muted-foreground text-sm">Manage all teams.</p>
	</div>

	<TeamsTable teams={teamsQuery.data?.teams || []} />
</div>
