import { authClient } from '$lib/auth/client.svelte';
import { queryOptions } from '@tanstack/svelte-query';

export const accountsQueryOptions = queryOptions({
	queryKey: ['auth', 'accounts'],
	queryFn: () => authClient.listAccounts().then((d) => d.data)
});
