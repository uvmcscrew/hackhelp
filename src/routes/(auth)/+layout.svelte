<script lang="ts">
	import MadeWith from '$lib/components/MadeWith.svelte';
	import { Card } from '$lib/components/ui/card';

	let { children } = $props();
</script>

<div class="flex h-screen w-screen flex-col place-content-center items-center bg-inherit px-2">
	<Card class="w-full sm:w-1/2 lg:w-1/3">{@render children()}</Card>

	<span class="absolute bottom-0 mb-2 inline-flex w-screen justify-center">
		<MadeWith />
	</span>
</div>
