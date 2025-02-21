<script lang="ts">
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import * as Avatar from './ui/avatar';
	import { buttonVariants } from './ui/button';

	import * as DropdownMenu from './ui/dropdown-menu';
	import type { User } from '$lib/server/db/schema';
	import { goto } from '$app/navigation';
	import { queries } from '$lib/trpc/client/queries.svelte';
	import posthog from 'posthog-js';

	type Props = {
		user: User;
	};
	const { user }: Props = $props();

	let accountData = queries.queryWhoami({ user });
	const image = `https://avatars.githubusercontent.com/u/${$accountData.data.user.githubId}`;
</script>

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
		<DropdownMenu.Label>{$accountData.data.user.fullName}</DropdownMenu.Label>
		<DropdownMenu.Separator />
		{#if $accountData.data.user.isOrgAdmin}
			<DropdownMenu.Item class="w-full hover:cursor-pointer"
				>{#snippet child({ props })}
					<a {...props} href="/admin"> Admin</a>
				{/snippet}</DropdownMenu.Item
			>
		{/if}

		<DropdownMenu.Item class="w-full hover:cursor-pointer"
			>{#snippet child({ props })}
				<a {...props} href="/account">Settings</a>
			{/snippet}</DropdownMenu.Item
		>
		<DropdownMenu.Separator />
		<DropdownMenu.Item class="w-full"
			>{#snippet child({ props })}
				<button
					{...props}
					onclick={async (e) => {
						await fetch('/auth/logout', { method: 'POST' });
						posthog.reset();
						await goto('/auth/login');
					}}>Logout</button
				>
			{/snippet}</DropdownMenu.Item
		>
	</DropdownMenu.Content>
</DropdownMenu.Root>
