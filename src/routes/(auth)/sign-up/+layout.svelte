<script lang="ts">
	import { CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<CardHeader
	><CardTitle>HackHelp Sign Up</CardTitle>
	<CardDescription
		>If you already have a HackHelp account, make sure you do not sign up with MLH; instead, log in
		otherwise and link your MLH account to HackHelp. Competitors must first <a
			class="text-primary hover:text-primary/80 underline"
			href="https://go.uvm.edu/hacks26">register on MLH</a
		>to officially participate in the event.</CardDescription
	>
</CardHeader>

{@render children()}
