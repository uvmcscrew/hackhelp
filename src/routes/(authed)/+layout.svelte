<script lang="ts">
	import SignoutWatcher from '$lib/components/signout-watcher.svelte';
	import type { LayoutProps } from './$types';
	import Header from './_components/header.svelte';

	let { data, children }: LayoutProps = $props();
</script>

<SignoutWatcher />

<Header authData={data.authData} />

{@render children()}
