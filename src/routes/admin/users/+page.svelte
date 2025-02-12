<script lang="ts">
	import type { PageProps } from './$types';
	import UsersTable from './users-table.svelte';

	let props: PageProps = $props();
</script>

<UsersTable users={props.data} />
