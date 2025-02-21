import posthog from 'posthog-js';
import { browser } from '$app/environment';

export const load = async () => {
	if (browser) {
		posthog.init('phc_rpv1K3BqyoUeD0AWDrilTJFebDceDdLHVnihs4Oi88x', {
			api_host: 'https://us.i.posthog.com',
			capture_pageview: false,
			capture_pageleave: false
		});
	}
	return;
};
