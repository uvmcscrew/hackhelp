<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import type { PageProps } from './$types';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import Teamcard from './_components/teamcard.svelte';

	let { data }: PageProps = $props();

	let teamsQuery = createQuery(() =>
		orpc.teams.listAll.queryOptions({
			initialData: data.allTeams
		})
	);
</script>

<div>
	{#each teamsQuery.data as team (team.id)}
		<Teamcard {team} />
	{:else}
		Nothing to see here...
	{/each}
</div>
