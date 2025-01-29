<script lang="ts">
	import '../app.css';

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

	let { children } = $props();

	$effect(() => {
		const mqColorScheme = window.matchMedia('(prefers-color-scheme: dark)');

		mqColorScheme.addEventListener('change', (e) => {
			document.documentElement.classList.toggle('dark', e.matches);
		});

		return () => {
			mqColorScheme.removeEventListener('change', (e) => {
				document.documentElement.classList.toggle('dark', e.matches);
			});
		};
	});
</script>

<PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
	{@render children()}
	<SvelteQueryDevtools />
</PersistQueryClientProvider>
