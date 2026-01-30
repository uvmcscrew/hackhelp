<script lang="ts">
	import type { PageProps } from './$types';
	import TeamViewCard from './team-view-card.svelte';
	import TeamsTable from './teams-table.svelte';

	let props: PageProps = $props();
</script>

<svelte:head>
	<title>Teams | HackHelp Admin</title>
</svelte:head>

<div
	class="bg-secondary grid min-h-[calc(100vh-4rem-2rem)] w-screen grid-cols-4 grid-rows-3 gap-2 overflow-y-auto p-2"
>
	<TeamsTable teams={props.data} />
	<TeamViewCard />
</div>
