<script lang="ts">
	import Menu from 'lucide-svelte/icons/menu';
	import Package2 from 'lucide-svelte/icons/package-2';
	import FireExtinguisher from 'lucide-svelte/icons/fire-extinguisher';

	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import type { LayoutProps } from './$types';
	import { goto } from '$app/navigation';
	import UserDropdown from '$lib/components/UserDropdown.svelte';

	let { data, children }: LayoutProps = $props();
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
		<a href="/home" class="text-foreground hover:text-foreground transition-colors"> Dashboard </a>
		<a href="/home/tickets" class="text-muted-foreground hover:text-foreground transition-colors">
			Tickets
		</a>
		<a href="/home/analytics" class="text-muted-foreground hover:text-foreground transition-colors">
			Analytics
		</a>
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
					<Package2 class="h-6 w-6" />
					<span class="sr-only">HackHelp</span>
				</a>
				<a href="/home" class="hover:text-foreground"> Dashboard </a>
				<a href="/home/tickets" class="text-muted-foreground hover:text-foreground"> Tickets </a>
				<a href="/home/analytics" class="text-muted-foreground hover:text-foreground">
					Analytics
				</a>
			</nav>
		</Sheet.Content>
	</Sheet.Root>
	<div class="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
		<UserDropdown user={data.user} />
	</div>
</header>
{@render children()}
