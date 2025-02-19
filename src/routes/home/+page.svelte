<script lang="ts">
	import queries from '$lib/trpc/client/queries.svelte';
	import type { PageProps } from './$types';
	import TeamCard from './TeamCard.svelte';

	let { data }: PageProps = $props();

	const account = queries.queryWhoami(data);
</script>

<svelte:head>
	<title>Competitor Home</title>
</svelte:head>

<div class="grid h-[calc(100vh-4rem-2rem)] w-screen grid-cols-3 grid-rows-2 p-2">
	<TeamCard teamData={data.team} />
</div>
