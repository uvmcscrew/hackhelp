<script lang="ts">
	import { CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<CardHeader
	><CardTitle>HackHelp Sign In</CardTitle>
	<CardDescription>If you're a UVM student or faculty member, use NetID sign in.</CardDescription>
</CardHeader>

{@render children()}
