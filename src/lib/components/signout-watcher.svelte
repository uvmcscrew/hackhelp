<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { sessionQueryOptions } from '$lib/auth/client.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const sessionQuery = createQuery(() => sessionQueryOptions);
	$effect(() => {
		if (sessionQuery.isError || sessionQuery.data === null) {
			void goto(resolve('/(auth)/login'));
		}
	});
</script>
