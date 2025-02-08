<script lang="ts">
	import '../app.css';

	let { children } = $props();
	import { ModeWatcher } from 'mode-watcher';
	import { browser } from '$app/environment';
	import { QueryClient } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { PersistQueryClientProvider } from '@tanstack/svelte-query-persist-client';
	import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser
			}
		}
	});

	const persister = createSyncStoragePersister({
		storage: browser ? window.localStorage : null
	});
</script>

<ModeWatcher />

<PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
	<main>
		{@render children()}
	</main>
	<SvelteQueryDevtools />
</PersistQueryClientProvider>
