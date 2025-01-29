<script lang="ts">
	import { Card } from '$lib/components/ui/card';

	let { children } = $props();
</script>

<div class="grid h-screen w-screen place-content-center bg-inherit">
	<Card>{@render children()}</Card>
</div>
