<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div class="flex justify-center overflow-x-clip">
	{@render children()}
</div>
