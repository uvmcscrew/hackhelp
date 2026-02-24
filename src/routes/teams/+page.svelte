<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import Teamcard from './_components/teamcard.svelte';

	let teamsQuery = createQuery(() => orpc.teams.listAll.queryOptions());
</script>

<div class="container mx-auto max-w-3xl py-8">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Teams</h1>
		<p class="text-muted-foreground text-sm">Browse public teams looking for members.</p>
	</div>

	{#if teamsQuery.isLoading}
		<p class="text-muted-foreground py-8 text-center">Loading teams...</p>
	{:else}
		<div class="grid gap-4">
			{#each teamsQuery.data ?? [] as team (team.id)}
				<Teamcard {team} />
			{:else}
				<p class="text-muted-foreground py-8 text-center">No public teams yet.</p>
			{/each}
		</div>
	{/if}
</div>
