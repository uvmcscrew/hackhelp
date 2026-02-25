<script lang="ts">
	import { CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<CardHeader
	><CardTitle>HackHelp Sign In</CardTitle>
	<CardDescription
		>If you already have a HackHelp account, make sure you do not sign in with MLH, unless you've
		already linked your MLH profile to HackHelp. Competitors must first <a
			class="text-primary hover:text-primary/80 underline"
			href="https://go.uvm.edu/hacks26">register on MLH</a
		>to officially participate in the event.</CardDescription
	>
</CardHeader>

{@render children()}
