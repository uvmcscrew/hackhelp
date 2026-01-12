<script lang="ts">
	import type { LayoutProps } from './$types';
	import UserDropdown from '$lib/components/UserDropdown.svelte';
	import ColorModeButton from '$lib/components/ColorModeButton.svelte';
	import MadeWith from '$lib/components/MadeWith.svelte';
	import queries from '$lib/trpc/client/queries.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import WidthWarning from '$lib/components/WidthWarning.svelte';
	import { browser } from '$app/environment';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createQuery } from '@tanstack/svelte-query';

	let { data: initialData, children }: LayoutProps = $props();

	const account = createQuery(() => orpc.account.whoami.queryOptions({ initialData }));

	const links = [
		{
			href: '/home',
			text: 'Dashboard'
		}
	];

	if (account.data.user.teamId !== null) {
		links.push({
			href: '/home/tickets',
			text: 'Tickets'
		});
	}
</script>

<header
	class="bg-background sticky top-0 flex h-16 w-screen items-center justify-between gap-4 border-b px-4 md:px-6"
>
	<Logo />

	{#if browser}
		<WidthWarning />
	{/if}

	<div class="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
		<ColorModeButton />
		<UserDropdown user={initialData.user} />
	</div>
</header>
<div class="bg-background">{@render children()}</div>
<footer class=" bg-background flex h-8 justify-center border-t">
	<MadeWith />
</footer>
