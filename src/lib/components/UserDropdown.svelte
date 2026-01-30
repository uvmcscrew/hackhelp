<script lang="ts">
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import * as Avatar from './ui/avatar';
	import { buttonVariants } from './ui/button';

	import * as DropdownMenu from './ui/dropdown-menu';
	import { goto } from '$app/navigation';
	import { posthogHandler } from '$lib/utils';
	import { resolve } from '$app/paths';
	import type { AuthData } from '$lib/auth/server.server';
	import { signOutAndClearCache, useSession } from '$lib/auth/client.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';

	type Props = {
		authData: AuthData;
	};
	const { authData }: Props = $props();

	const qc = useQueryClient();

	const userInfo = useSession(authData);

	const roles = $derived((userInfo.data?.user.role || '').split(','));
	const isAdmin = $derived(roles.includes('admin'));
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={buttonVariants({ variant: 'secondary', size: 'icon', class: 'rounded-full' })}
	>
		<Avatar.Root>
			<Avatar.Image src={userInfo.data?.user.image} alt="User avatar" />
			<Avatar.Fallback><CircleUser class="h-5 w-5" /></Avatar.Fallback>
		</Avatar.Root>

		<span class="sr-only">Toggle user menu</span>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Label
			>{userInfo.data?.user.name ||
				userInfo.data?.user.username ||
				userInfo.data?.user.email}</DropdownMenu.Label
		>
		<DropdownMenu.Separator />
		{#if isAdmin}
			<DropdownMenu.Item class="w-full hover:cursor-pointer"
				>{#snippet child({ props })}
					<a {...props} href="/admin">Admin</a>
				{/snippet}</DropdownMenu.Item
			>
		{/if}
		{#if roles.includes('mentor') || isAdmin}
			<DropdownMenu.Item class="w-full hover:cursor-pointer"
				>{#snippet child({ props })}
					<a {...props} href="/mentor">Mentor Home</a>
				{/snippet}</DropdownMenu.Item
			>
		{/if}
		{#if roles.includes('judge') || isAdmin}
			<DropdownMenu.Item class="w-full hover:cursor-pointer"
				>{#snippet child({ props })}
					<a {...props} href="/judging">Judge Home</a>
				{/snippet}</DropdownMenu.Item
			>
		{/if}
		<DropdownMenu.Item class="w-full hover:cursor-pointer"
			>{#snippet child({ props })}
				<a {...props} href="/account">Account Settings</a>
			{/snippet}</DropdownMenu.Item
		>
		<DropdownMenu.Separator />
		<DropdownMenu.Item class="w-full"
			>{#snippet child({ props })}
				<button
					{...props}
					onclick={async (_e) => {
						await signOutAndClearCache(qc);
						posthogHandler((posthog) => posthog.reset());
						await goto(resolve('/(auth)/login'), { replaceState: true, invalidateAll: true });
					}}>Logout</button
				>
			{/snippet}</DropdownMenu.Item
		>
	</DropdownMenu.Content>
</DropdownMenu.Root>
