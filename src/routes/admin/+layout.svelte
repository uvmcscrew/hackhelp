<script lang="ts">
	import Activity from 'lucide-svelte/icons/activity';
	import ArrowUpRight from 'lucide-svelte/icons/arrow-up-right';
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import Menu from 'lucide-svelte/icons/menu';
	import Package2 from 'lucide-svelte/icons/package-2';
	import Search from 'lucide-svelte/icons/search';
	import Users from 'lucide-svelte/icons/users';
	import FireExtinguisher from 'lucide-svelte/icons/fire-extinguisher';

	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { LayoutProps } from './$types';
	import { goto } from '$app/navigation';

	let { data, children }: LayoutProps = $props();

	const image = `https://avatars.githubusercontent.com/u/${data.user.githubId}`;
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
					<span class="sr-only">Acme Inc</span>
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
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class={buttonVariants({ variant: 'secondary', size: 'icon', class: 'rounded-full' })}
			>
				<Avatar.Root>
					<Avatar.Image src={image} alt="User avatar" />
					<Avatar.Fallback><CircleUser class="h-5 w-5" /></Avatar.Fallback>
				</Avatar.Root>

				<span class="sr-only">Toggle user menu</span>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Label>{data.user.fullName}</DropdownMenu.Label>
				<DropdownMenu.Separator />

				<DropdownMenu.Item class="w-full"
					>{#snippet child({ props })}
						<button
							{...props}
							onclick={async (e) => {
								await goto('/account');
							}}>Settings</button
						>
					{/snippet}</DropdownMenu.Item
				>
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="w-full"
					>{#snippet child({ props })}
						<button
							{...props}
							onclick={async (e) => {
								await fetch('/auth/logout', { method: 'POST' });
								await goto('/auth/login');
							}}>Logout</button
						>
					{/snippet}</DropdownMenu.Item
				>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</header>
{@render children()}
