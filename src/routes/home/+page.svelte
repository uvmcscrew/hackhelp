<script lang="ts">
	import type { PageProps } from './$types';
	import BottomLeftCard from './ bottomleft-card.svelte';
	import TeamCard from './team-card.svelte';
	import TicketTableCard from './ticket-table-card.svelte';
	import { posthogHandler } from '$lib/utils';
	import { createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';

	let { data: initialData }: PageProps = $props();

	let account = createQuery(() => orpc.account.whoami.queryOptions({ initialData }));

	posthogHandler((posthog) =>
		posthog.identify(account.data.user.username, {
			id: account.data.user.id,
			username: account.data.user.username,
			isOrgAdmin: account.data.user.isOrgAdmin,
			isOrgMember: account.data.user.isOrgMember
		})
	);
</script>

<svelte:head>
	<title>Competitor Home</title>
</svelte:head>

<div
	class=" bg-secondary grid h-[calc(100vh-4rem-2rem)] w-screen grid-cols-3 grid-rows-2 gap-2 p-2"
>
	<TeamCard teamData={initialData.team} />
	<BottomLeftCard />
	<TicketTableCard />
</div>
