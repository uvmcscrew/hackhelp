<script lang="ts">
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import * as Avatar from './ui/avatar';
	import { buttonVariants } from './ui/button';

	import * as DropdownMenu from './ui/dropdown-menu';
	import type { User } from '$lib/server/db/schema';
	import { goto } from '$app/navigation';

	type Props = {
		user: User;
	};

	const { user }: Props = $props();
	const image = `https://avatars.githubusercontent.com/u/${user.githubId}`;
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
		<DropdownMenu.Label>{user.fullName}</DropdownMenu.Label>
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
