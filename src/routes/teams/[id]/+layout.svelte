<svelte:options runes={true} />

<script lang="ts">
	import * as Card from '$lib/components/ui/card';

	import MadeWith from '$lib/components/MadeWith.svelte';

	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
	<title>{data.team.name} | HackHelp Team</title>
</svelte:head>

<div class="flex min-h-screen w-full flex-col gap-y-4 px-2 pt-16 lg:mx-0 lg:w-xl">
	<h1 class="w-full text-center text-2xl font-semibold">Team</h1>
	<Card.Root
		><Card.CardHeader class="flex flex-row items-center justify-between"
			><Card.CardTitle>Profile</Card.CardTitle>
		</Card.CardHeader><Card.CardContent class="flex flex-row"></Card.CardContent>
	</Card.Root>

	{@render children()}

	<div class="mt-auto mb-2 inline-flex justify-center"><MadeWith /></div>
</div>
