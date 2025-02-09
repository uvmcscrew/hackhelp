<script lang="ts">
	import '../app.css';

	let { children } = $props();
	import { ModeWatcher } from 'mode-watcher';
	import { browser } from '$app/environment';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	// import { PersistQueryClientProvider } from '@tanstack/svelte-query-persist-client';
	// import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser,
				refetchInterval: 5000
			}
		}
	});
</script>

<ModeWatcher />

<QueryClientProvider client={queryClient}>
	<main>
		{@render children()}
	</main>
	<SvelteQueryDevtools />
</QueryClientProvider>
