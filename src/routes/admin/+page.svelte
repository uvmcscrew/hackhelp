<script lang="ts">
	import queries from '$lib/trpc/client/queries.svelte';
	import { posthogHandler } from '$lib/utils';
	import type { PageProps } from './$types';
	import MyTicketTableCard from './my-ticket-table-card.svelte';
	import TeamsUserCard from './teams-status-card.svelte';
	import TicketStatusCard from './ticket-status-card.svelte';
	import WhitelistCard from './whitelist-card.svelte';

	let { data }: PageProps = $props();

	let account = queries.queryWhoami(data);

	posthogHandler((posthog) =>
		posthog.identify($account.data.user.username, {
			id: $account.data.user.id,
			username: $account.data.user.username,
			isOrgAdmin: $account.data.user.isOrgAdmin,
			isOrgMember: $account.data.user.isOrgMember,
			teamId: $account.data.user.teamId
		})
	);
</script>

<div
	class=" bg-secondary grid h-[calc(100vh-4rem-2rem)] w-screen grid-cols-4 grid-rows-3 gap-2 p-2"
>
	<MyTicketTableCard />
	<TicketStatusCard />
	<WhitelistCard />
	<TeamsUserCard />
</div>
