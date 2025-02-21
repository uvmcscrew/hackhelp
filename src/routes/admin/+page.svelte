<script lang="ts">
	import queries from '$lib/trpc/client/queries.svelte';
	import posthog from 'posthog-js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let account = queries.queryWhoami(data);

	posthog.identify($account.data.user.username, {
		id: $account.data.user.id,
		username: $account.data.user.username,
		isOrgAdmin: $account.data.user.isOrgAdmin,
		isOrgMember: $account.data.user.isOrgMember
	});
</script>

hello {data.user.username}
