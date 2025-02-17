<svelte:options runes={true} />

<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import JoinExistingForm from './JoinExistingForm.svelte';
	import Menu from 'lucide-svelte/icons/menu';
	import FireExtinguisher from 'lucide-svelte/icons/fire-extinguisher';

	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import type { LayoutProps } from './$types';
	import UserDropdown from '$lib/components/UserDropdown.svelte';
	import { page } from '$app/state';
	import ColorModeButton from '$lib/components/ColorModeButton.svelte';
	import MadeWith from '$lib/components/MadeWith.svelte';
	import queries from '$lib/trpc/client/queries.svelte';
	import Logo from '$lib/components/Logo.svelte';

	let { children, data }: LayoutProps = $props();
</script>

<header
	class="bg-background sticky top-0 flex h-16 w-screen items-center justify-between gap-4 border-b px-4 md:px-6"
>
	<Logo />
	<div class="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
		<ColorModeButton />
		<UserDropdown user={data.user} />
	</div>
</header>
<div class="grid h-[calc(100vh-4rem-2rem)] w-screen grid-cols-3 grid-rows-2 p-2">
	<Tabs.Root value="join" class="col-span-1 col-start-2 row-span-1 row-start-1">
		<Tabs.List class="grid w-full grid-cols-2">
			<Tabs.Trigger value="join">Join Team</Tabs.Trigger>
			<Tabs.Trigger value="create">Create Team</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="join" class="h-full w-full">
			<JoinExistingForm />
		</Tabs.Content>
		<Tabs.Content value="create" class="h-full w-full">
			{@render children()}
		</Tabs.Content>
	</Tabs.Root>
</div>
<footer class=" bg-background flex h-8 justify-center border-t">
	<MadeWith />
</footer>
