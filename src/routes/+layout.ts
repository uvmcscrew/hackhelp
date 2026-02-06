import posthog from 'posthog-js';
import { browser, dev } from '$app/environment';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/svelte-query';
import { toast } from 'svelte-sonner';

export const load = () => {
	if (browser && !dev) {
		posthog.init('phc_rpv1K3BqyoUeD0AWDrilTJFebDceDdLHVnihs4Oi88x', {
			api_host: 'https://us.i.posthog.com',
			capture_pageview: false,
			capture_pageleave: false,
			person_profiles: 'identified_only'
		});
	}

	const queryCache = new QueryCache({
		onError: (error, _) => {
			console.error(error);
			toast.error('Failed to fetch data', {
				description: error.message
			});
		}
	});

	const mutationCache = new MutationCache({
		onError: (error) => {
			console.error(error);
			toast.error('Failed to perform action', {
				description: error.message
			});
		}
	});

	const queryClient = new QueryClient({
		queryCache,
		mutationCache,
		defaultOptions: {
			queries: {
				enabled: browser,
				refetchInterval: 90 * 1000, // 90 seconds at minimum
				staleTime: 5 * 60 * 1000, // 5 minutes
				refetchOnWindowFocus: true,
				refetchOnMount: 'always'
			}
		}
	});

	return { queryClient };
};
