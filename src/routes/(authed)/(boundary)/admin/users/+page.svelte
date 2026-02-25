<svelte:options runes={true} />

<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import UserTable from './_components/user-table.svelte';

	const usersQuery = createQuery(() => orpc.admin.users.all.queryOptions());
</script>

<svelte:head>
	<title>User Administration | HackHelp</title>
</svelte:head>

<div class="container mx-auto py-8">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Users</h1>
		<p class="text-muted-foreground text-sm">Manage all registered users.</p>
	</div>

	<UserTable users={usersQuery.data?.users || []} />
</div>
