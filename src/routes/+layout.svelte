<script lang="ts">
	import '../app.css';

	import { ModeWatcher } from 'mode-watcher';
	import { browser, dev } from '$app/environment';
	import { MutationCache, QueryCache, QueryClient } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { Toaster } from '$lib/components/ui/sonner';
	import { PersistQueryClientProvider } from '@tanstack/svelte-query-persist-client';
	import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
	import { toast } from 'svelte-sonner';
	import posthog from 'posthog-js';

	import '@fontsource-variable/lora';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/jetbrains-mono';
	import { afterNavigate, beforeNavigate } from '$app/navigation';

	let { children } = $props();

	if (browser && !dev) {
		beforeNavigate(() => posthog.capture('$pageleave'));
		afterNavigate(() => posthog.capture('$pageview'));
	}

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
