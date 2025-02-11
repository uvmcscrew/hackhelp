<script lang="ts">
	import Menu from 'lucide-svelte/icons/menu';
	import FireExtinguisher from 'lucide-svelte/icons/fire-extinguisher';

	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import type { LayoutProps } from './$types';
	import UserDropdown from '$lib/components/UserDropdown.svelte';
	import { page } from '$app/state';
	import ColorModeButton from '$lib/components/ColorModeButton.svelte';
	import MadeWith from '$lib/components/MadeWith.svelte';

	let { data, children }: LayoutProps = $props();

	const links = [
		{
			href: '/admin',
			text: 'Dashboard'
		},
		{
			href: '/admin/tickets',
			text: 'Tickets'
		},
		{
			href: '/admin/analytics',
			text: 'Analytics'
		},
		{
			href: '/admin/teams',
			text: 'Teams'
		},
		{
			href: '/admin/users',
			text: 'Users'
		}
	];
</script>

<header
	class="bg-background sticky top-0 flex h-16 w-screen items-center justify-between gap-4 border-b px-4 md:px-6"
>
	<nav
		class="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6"
	>
		<a href="##" class="flex items-center gap-2 text-lg font-semibold md:text-base">
			<FireExtinguisher class="h-6 w-6" />
			<span class="sr-only">HackHelp</span>
		</a>
		{#each links as link}
			<a
				href={link.href}
				class={page.url.pathname === link.href
					? 'text-foreground hover:text-foreground transition-colors'
					: 'text-muted-foreground hover:text-foreground transition-colors'}
			>
				{link.text}
			</a>
		{/each}
	</nav>
	<Sheet.Root>
		<Sheet.Trigger
			class={buttonVariants({ variant: 'outline', size: 'icon', class: 'shrink-0 md:hidden' })}
		>
			<Menu class="h-5 w-5" />
			<span class="sr-only">Toggle navigation menu</span>
		</Sheet.Trigger>
		<Sheet.Content side="left">
			<nav class="grid gap-6 text-lg font-medium">
				<a href="##" class="flex items-center gap-2 text-lg font-semibold">
					<FireExtinguisher class="h-6 w-6" />
					<span class="sr-only">HackHelp</span>
				</a>
				{#each links as link}
					<a
						href={link.href}
						class={page.url.pathname === link.href
							? 'hover:text-foreground'
							: 'text-muted-foreground hover:text-foreground'}
					>
						{link.text}
					</a>
				{/each}
			</nav>
		</Sheet.Content>
	</Sheet.Root>
	<div class="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
		<ColorModeButton />
		<UserDropdown user={data.user} />
	</div>
</header>
{@render children()}
<footer class="border-t-border mt-auto flex w-screen justify-center">
	<MadeWith />
</footer>
