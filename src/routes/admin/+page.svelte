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

hello {data.user.username}
