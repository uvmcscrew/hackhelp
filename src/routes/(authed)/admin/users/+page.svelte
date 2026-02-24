<svelte:options runes={true} />

<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { authClient } from '$lib/auth/client.svelte';
	import UserTable from './_components/user-table.svelte';

	const usersQuery = createQuery(() => ({
		queryKey: ['admin', 'users'],
		queryFn: async () => {
			const result = await authClient.admin.listUsers({
				query: { limit: 1000 },
				fetchOptions: { throw: true }
			});
			return result.users;
		}
	}));
</script>

<div class="container mx-auto py-8">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Users</h1>
		<p class="text-muted-foreground text-sm">Manage all registered users.</p>
	</div>

	<UserTable users={usersQuery.data ?? []} />
</div>
