<script lang="ts">
	import queries from '$lib/trpc/client/queries.svelte';
	import { posthogHandler } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let account = queries.queryWhoami(data);

	posthogHandler((posthog) =>
		posthog.identify($account.data.user.username, {
			id: $account.data.user.id,
			username: $account.data.user.username,
			isOrgAdmin: $account.data.user.isOrgAdmin,
			isOrgMember: $account.data.user.isOrgMember
		})
	);
</script>

<div
	class=" bg-secondary grid h-[calc(100vh-4rem-2rem)] w-screen grid-cols-3 grid-rows-2 gap-2 p-2"
>
	hello {data.user.username}
</div>
