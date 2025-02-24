<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import queries from '$lib/trpc/client/queries.svelte';
	import type { RouterOutputs } from '$lib/trpc/server';
	import * as Tabs from '$lib/components/ui/tabs';
	import RepoCreatorSheet from './repo-creator-sheet.svelte';
</script>

<Tabs.Root value="challenge" class="col-span-1 col-start-1 row-span-1 row-start-2 flex flex-col">
	<Tabs.List class="w-fit">
		<Tabs.Trigger value="challenge">Challenge</Tabs.Trigger>
		<Tabs.Trigger value="repos">Repositories</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="challenge" class="h-auto shrink-0 grow">
		<Card.Root class="col-span-1 col-start-1 row-span-1 row-start-2 h-full">
			<Card.Header>
				<Card.Title>Your Challenge</Card.Title>
			</Card.Header>
			<Card.Content>No challenge selected?</Card.Content>
			<Card.Footer class="grid w-fit grid-cols-2 grid-rows-3"></Card.Footer>
		</Card.Root>
	</Tabs.Content>
	<Tabs.Content value="repos" class="h-auto shrink-0 grow">
		<Card.Root class="col-span-1 col-start-1 row-span-1 row-start-2 h-full">
			<Card.Header class="flex flex-row items-center justify-between">
				<Card.Title>Repositories</Card.Title>
				<RepoCreatorSheet />
			</Card.Header>
			<Card.Content>No repositories</Card.Content>
			<Card.Footer class="grid w-fit grid-cols-2 grid-rows-3"></Card.Footer>
		</Card.Root>
	</Tabs.Content>
</Tabs.Root>
