<script lang="ts">
	import SignoutWatcher from '$lib/components/signout-watcher.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<SignoutWatcher />

<div class="flex justify-center overflow-x-clip">
	{@render children()}
</div>
