<svelte:options runes={true} />

<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import DoorOpen from 'lucide-svelte/icons/door-open';

	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	import { goto } from '$app/navigation';
	import MadeWith from '$lib/components/MadeWith.svelte';
	import { posthogHandler } from '$lib/utils';
	import { resolve } from '$app/paths';
	import { authClient, useSession } from '$lib/auth/client.svelte';
	import type { PageProps } from './$types';
	import * as Tabs from '$lib/components/ui/tabs';
	import PasskeysCard from './_cards/passkeys-card.svelte';

	let { data }: PageProps = $props();

	const { data: session } = useSession(data.userInitialData);

	let isAdmin = $derived(
		session?.user.role ? session.user.role.split(',').includes('admin') : false
	);
</script>

<svelte:head>
	<title>Account Home | HackHelp</title>
</svelte:head>

<div class="mx-auto flex min-h-screen w-xl flex-col gap-y-4 pt-16">
	<h1 class="w-full text-center text-2xl font-semibold">Account</h1>
	<!-- <div class="text-foreground flex w-full justify-center">
		{#if accountWithStatus.data.user.isOrgMember}
			<Button
				variant="link"
				class="hover:cursor-pointer"
				href={accountWithStatus.data.user.isOrgAdmin ? '/admin' : '/home'}
				><ArrowLeft class="h-8 w-8 " />Back</Button
			>
		{/if}
	</div> -->
	<Card.Root
		><Card.CardHeader><Card.CardTitle>Profile</Card.CardTitle></Card.CardHeader><Card.CardContent
			class="flex flex-row"
			><Avatar.Root class="h-16 w-16">
				<Avatar.Image src={session?.user.image} alt="User avatar" />
				<Avatar.Fallback><CircleUser class="h-16 w-16" /></Avatar.Fallback>
			</Avatar.Root>
			<div class="flex flex-col pl-4">
				<span class="inline-flex gap-x-2">
					<h2 class="text-2xl font-medium">{session?.user.name || 'Undefined'}</h2>
					{#if isAdmin}
						<Badge class="ml-2 rounded-full bg-purple-400 px-2 py-1" hoverEffects={false}
							>Administrator</Badge
						>
					{/if}
				</span>
				<!-- <span class="text-secondary-foreground font-mono"
					>{accountWithStatus.data.user.username}</span
				> -->
			</div>
			<div class="ml-auto grid place-content-start">
				<Button
					variant="destructive"
					title="Sign Out"
					class="hover:cursor-pointer"
					onclick={async () => {
						await authClient.signOut();
						posthogHandler((posthog) => posthog.reset());
						await goto(resolve('/(auth)/login'));
					}}><DoorOpen class="h-8 w-8" />Sign Out</Button
				>
			</div>
		</Card.CardContent>
	</Card.Root>

	<Tabs.Root value="passkeys">
		<Tabs.List>
			<Tabs.Trigger value="account">Account</Tabs.Trigger>
			<Tabs.Trigger value="passkeys">Passkeys</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="account">
			<Card.Root>
				<Card.Header>
					<Card.Title>Account</Card.Title>
					<Card.Description>
						Make changes to your account here. Click save when you&apos;re done.
					</Card.Description>
				</Card.Header>
				<Card.Content class="grid gap-6"></Card.Content>
				<Card.Footer>
					<Button>Save changes</Button>
				</Card.Footer>
			</Card.Root>
		</Tabs.Content>
		<Tabs.Content value="passkeys">
			<PasskeysCard />
		</Tabs.Content>
	</Tabs.Root>

	<div class="mt-auto mb-2 inline-flex justify-center"><MadeWith /></div>
</div>
