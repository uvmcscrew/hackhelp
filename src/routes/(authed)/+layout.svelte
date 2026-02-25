<script lang="ts">
	import SignoutWatcher from '$lib/components/signout-watcher.svelte';
	import type { LayoutProps } from './$types';
	import Header from './_components/header.svelte';

	let { data, children }: LayoutProps = $props();
</script>

<SignoutWatcher />

<div class="min-h-screen w-screen overflow-x-clip">
	<Header authData={data.authData} />
	{@render children()}
</div>
