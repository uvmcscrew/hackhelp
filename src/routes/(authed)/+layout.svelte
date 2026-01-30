<script lang="ts">
	import type { LayoutProps } from './$types';
	import Header from './_components/header.svelte';

	let { data, children }: LayoutProps = $props();
</script>

<Header authData={data.authData} />

{@render children()}
