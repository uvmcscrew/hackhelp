<script lang="ts">
	import UserDropdown from '$lib/components/UserDropdown.svelte';
	import { page } from '$app/state';
	import ColorModeButton from '$lib/components/ColorModeButton.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import WidthWarning from '$lib/components/WidthWarning.svelte';
	import { browser } from '$app/environment';

	type Props = {
		authData: AuthData;
	};
	const { authData }: Props = $props();

	const links = [
		{
			href: '/admin',
			text: 'Dashboard'
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
	class="bg-background sticky top-0 z-50 flex h-16 w-screen items-center justify-between gap-4 border-b px-4 md:px-6"
>
	<Logo />

	{#if browser}
		<WidthWarning />
	{/if}

	<nav
		class="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6"
	>
		{#each links as link (link.href)}
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
	<div class="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
		<ColorModeButton />
		<UserDropdown {authData} />
	</div>
</header>
