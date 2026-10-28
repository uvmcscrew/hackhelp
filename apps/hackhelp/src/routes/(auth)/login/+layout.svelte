<script lang="ts">
	import { CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<CardHeader
	><CardTitle>HackHelp Sign In</CardTitle>
</CardHeader>

{@render children()}
