<script lang="ts">
	import '../app.css';

	let { children } = $props();
	import { ModeWatcher } from 'mode-watcher';
	import { browser } from '$app/environment';
	import {
		MutationCache,
		QueryCache,
		QueryClient,
		QueryClientProvider
	} from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { Toaster } from '$lib/components/ui/sonner';
	import { PersistQueryClientProvider } from '@tanstack/svelte-query-persist-client';
	import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
	import { toast } from 'svelte-sonner';

	const queryCache = new QueryCache({
		onError: (error, query) => {
			toast.error('Failed to fetch data', {
				description: error.message
			});
		}
	});

	const mutationCache = new MutationCache();

	const queryClient = new QueryClient({
		queryCache,
		mutationCache,
		defaultOptions: {
			queries: {
				enabled: browser,
				refetchInterval: 90 * 1000, // 90 seconds at minimum
				staleTime: 5 * 60 * 1000, // 5 minutes
				refetchOnWindowFocus: true
			}
		}
	});

	const persister = createSyncStoragePersister({
		storage: browser ? window.localStorage : null
	});
</script>

<ModeWatcher />

<PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
	<Toaster />
	{@render children()}
	<SvelteQueryDevtools />
</PersistQueryClientProvider>
