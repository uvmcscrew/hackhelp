<script lang="ts">
	import '../app.css';

	import { ModeWatcher } from 'mode-watcher';
	import { browser, dev } from '$app/environment';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import { Toaster } from '$lib/components/ui/sonner';
	import { PersistQueryClientProvider } from '@tanstack/svelte-query-persist-client';
	import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

	import '@fontsource-variable/lora';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/jetbrains-mono';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { posthogHandler } from '$lib/utils';

	let { data, children } = $props();

	if (browser && !dev) {
		beforeNavigate(() => posthogHandler((posthog) => posthog.capture('$pageleave')));
		afterNavigate(() => posthogHandler((posthog) => posthog.capture('$pageview')));
	}

	const persister = createAsyncStoragePersister({
		storage: browser ? window.localStorage : null
	});
</script>

<ModeWatcher />

<PersistQueryClientProvider client={data.queryClient} persistOptions={{ persister }}>
	<Toaster />
	{@render children()}
	<SvelteQueryDevtools />
</PersistQueryClientProvider>
