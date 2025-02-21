<script lang="ts">
	import queries from '$lib/trpc/client/queries.svelte';
	import type { PageProps } from './$types';
	import BottomLeftCard from './ bottomleft-card.svelte';
	import TeamCard from './team-card.svelte';
	import TicketTableCard from './ticket-table-card.svelte';
	import posthog from 'posthog-js';

	let { data }: PageProps = $props();

	let account = queries.queryWhoami(data);

	posthog.identify($account.data.user.username, {
		id: $account.data.user.id,
		username: $account.data.user.username,
		isOrgAdmin: $account.data.user.isOrgAdmin,
		isOrgMember: $account.data.user.isOrgMember
	});
</script>

<svelte:head>
	<title>Competitor Home</title>
</svelte:head>

<div
	class=" bg-secondary grid h-[calc(100vh-4rem-2rem)] w-screen grid-cols-3 grid-rows-2 gap-2 p-2"
>
	<TeamCard teamData={data.team} />
	<BottomLeftCard />
	<TicketTableCard />
</div>
