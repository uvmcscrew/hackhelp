<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import DoorOpen from 'lucide-svelte/icons/door-open';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';

	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { goto } from '$app/navigation';

	let { data }: PageProps = $props();
	const image = `https://avatars.githubusercontent.com/u/${data.user.githubId}`;
</script>

<div class="mx-auto flex min-h-screen w-xl flex-col gap-y-4 pt-16">
	<h1 class="w-full text-center text-2xl font-semibold">Account</h1>
	<div class="text-foreground flex w-full justify-center">
		<Button
			variant="link"
			class="hover:cursor-pointer"
			href={data.user.isAdmin ? '/admin' : '/home'}><ArrowLeft class="h-8 w-8 " />Back</Button
		>
	</div>
	<Card.Root
		><Card.CardHeader><Card.CardTitle>Profile</Card.CardTitle></Card.CardHeader><Card.CardContent
			class="flex flex-row"
			><Avatar.Root class="h-16 w-16">
				<Avatar.Image src={image} alt="User avatar" />
				<Avatar.Fallback><CircleUser class="h-16 w-16" /></Avatar.Fallback>
			</Avatar.Root>
			<div class="flex flex-col pl-4">
				<span class="inline-flex gap-x-2">
					<h2 class="text-lg font-medium">{data.user.fullName}</h2>
					{#if data.user.isAdmin}
						<Badge class="rounded-full px-2 ">Admin</Badge>
					{/if}
				</span>
				<span class="text-secondary-foreground font-mono">{data.user.username}</span>
			</div>
			<div class="ml-auto">
				<Button
					variant="destructive"
					title="Sign Out"
					onclick={async (e) => {
						await fetch('/auth/logout', { method: 'POST' });
						await goto('/auth/login');
					}}><DoorOpen class="h-8 w-8" />Sign Out</Button
				>
			</div>
		</Card.CardContent></Card.Root
	>
</div>
