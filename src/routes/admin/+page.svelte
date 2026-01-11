<script lang="ts">
	import queries from '$lib/trpc/client/queries.svelte';
	import { posthogHandler } from '$lib/utils';
	import type { PageProps } from './$types';
	import MyTicketTableCard from './my-ticket-table-card.svelte';
	import WhitelistCard from './ticket-view-card.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import AllTicketsTableCard from './all-tickets-table-card.svelte';
	import TicketViewCard from './ticket-view-card.svelte';

	let { data }: PageProps = $props();

	let account = queries.queryWhoami(data);

	posthogHandler((posthog) =>
		posthog.identify(account.data.user.username, {
			id: account.data.user.id,
			username: account.data.user.username,
			isOrgAdmin: account.data.user.isOrgAdmin,
			isOrgMember: account.data.user.isOrgMember,
			teamId: account.data.user.teamId
		})
	);
</script>

<svelte:head>
	<title>Home | HackHelp Admin</title>
</svelte:head>

<div
	class="bg-secondary grid min-h-[calc(100vh-4rem-2rem)] w-screen grid-cols-4 grid-rows-3 gap-2 overflow-y-scroll p-2"
>
	<Tabs.Root value="alltix" class="col-span-3 col-start-1 row-span-3 row-start-1">
		<Tabs.List class="grid w-full grid-cols-2">
			<Tabs.Trigger value="alltix">All Tickets</Tabs.Trigger>
			<Tabs.Trigger value="mytix">Assigned Tickets</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="mytix">
			<MyTicketTableCard />
		</Tabs.Content>
		<Tabs.Content value="alltix">
			<AllTicketsTableCard />
		</Tabs.Content>
	</Tabs.Root>
	<TicketViewCard />
</div>
