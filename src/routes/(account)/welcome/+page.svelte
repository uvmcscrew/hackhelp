<svelte:options runes={true} />

<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import CircleUser from 'lucide-svelte/icons/circle-user';

	import MadeWith from '$lib/components/MadeWith.svelte';
	import { useSession } from '$lib/auth/client.svelte';
	import type { PageProps } from './$types';
	import CardDescription from '$lib/components/ui/card/card-description.svelte';

	let { data }: PageProps = $props();

	const { data: session } = useSession(data.userInitialData);
</script>

<svelte:head>
	<title>Account Home | HackHelp</title>
</svelte:head>

<div class="mx-auto flex min-h-screen w-xl flex-col gap-y-4 pt-16">
	<h1 class="w-full text-center text-2xl font-semibold">Welcome!</h1>

	<Card.Root
		><Card.CardHeader
			><Card.CardTitle>Profile</Card.CardTitle>
			<CardDescription
				>Note that UVM users will have their profile information overridden to match their UVM
				accounts</CardDescription
			>
		</Card.CardHeader><Card.CardContent class="flex flex-row"
			><Avatar.Root class="h-16 w-16">
				<Avatar.Image src={session?.user.image} alt="User avatar" />
				<Avatar.Fallback><CircleUser class="h-16 w-16" /></Avatar.Fallback>
			</Avatar.Root>
			<div class="flex flex-col pl-4">
				<span class="inline-flex gap-x-2">
					<h2 class="text-2xl font-medium">{session?.user.name || 'Undefined'}</h2>
				</span>
				<span class="text-secondary-foreground font-mono">{session?.user.username}</span>
			</div>
		</Card.CardContent>
	</Card.Root>

	<div class="mt-auto mb-2 inline-flex justify-center"><MadeWith /></div>
</div>
