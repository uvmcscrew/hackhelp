<script lang="ts">
	import MadeWith from '$lib/components/MadeWith.svelte';
	import { Card } from '$lib/components/ui/card';

	let { children } = $props();
</script>

<div class="flex h-screen w-screen flex-col place-content-center items-center bg-inherit">
	<Card class="">{@render children()}</Card>

	<span class="absolute bottom-0 mb-2 inline-flex w-screen justify-center">
		<MadeWith />
	</span>
</div>
