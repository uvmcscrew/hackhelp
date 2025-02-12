<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageProps } from './$types';
	import UsersTable from './users-table.svelte';

	let props: PageProps = $props();
</script>

<div class="w-screen px-48 pt-8">
	<div class="flex flex-row items-center justify-between">
		<h1 class="py-2 text-2xl font-semibold">Users</h1>
		<div class="flex flex-row"><Button>Import Users</Button></div>
	</div>
	<UsersTable users={props.data} />
</div>
