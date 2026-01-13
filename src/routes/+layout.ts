import posthog from 'posthog-js';
import { browser, dev } from '$app/environment';

export const load = () => {
	if (browser && !dev) {
		posthog.init('phc_rpv1K3BqyoUeD0AWDrilTJFebDceDdLHVnihs4Oi88x', {
			api_host: 'https://us.i.posthog.com',
			capture_pageview: false,
			capture_pageleave: false,
			person_profiles: 'identified_only'
		});
	}
	return;
};
