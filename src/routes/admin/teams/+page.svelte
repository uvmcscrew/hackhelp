<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageProps } from './$types';
	import TeamsTable from './teams-table.svelte';

	let props: PageProps = $props();
</script>

<svelte:head>
	<title>Teams | HackHelp Admin</title>
</svelte:head>

<div class="w-screen px-48 pt-8">
	<div class="flex flex-row items-center justify-between">
		<h1 class="py-2 text-2xl font-semibold">Teams</h1>
		<div class="flex flex-row"><Button>Create Team</Button></div>
	</div>
	<TeamsTable teams={props.data} />
</div>
