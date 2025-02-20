<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import queries from '$lib/trpc/client/queries.svelte';
	import type { RouterOutputs } from '$lib/trpc/server';

	type Props = {
		teamData: RouterOutputs['competitor']['team']['get'];
	};

	let { teamData }: Props = $props();

	const team = queries.competitorGetMyTeam(teamData);

	let canJoinState = $state($team.data?.team.canJoin ?? false);
</script>

<Card.Root class="col-span-1 col-start-1 row-span-1 row-start-1 flex flex-col">
	<Card.Header>
		<Card.Title>My Team</Card.Title>
	</Card.Header>
	<Card.Content class="h-max grow">
		<h2 class="text-2xl font-semibold">{$team.data?.team.name}</h2>
	</Card.Content>
	<Card.Footer class="grid grid-cols-4 grid-rows-3 gap-y-2">
		<span class="text-muted-foreground col-span-2 row-start-1 text-base">Join Details</span>
		<div class="row-start-2 inline-flex items-center">
			<Label for="canJoin" class="text-base">Can Join</Label>
		</div>
		<div class="col-start-2 row-start-2 inline-flex items-center">
			<Switch id="canJoin" class="ml-2" bind:checked={canJoinState} />
		</div>
		<div class="row-start-3 inline-flex items-center">
			{#if canJoinState}
				<span class="text-base font-medium">Join Code</span>
			{/if}
		</div>
		<div class="col-start-2 row-start-3 inline-flex h-8 items-center">
			{#if canJoinState}
				<span class="bg-accent text-accent-foreground ml-2 rounded-sm p-1 font-mono"
					>{$team.data?.team.joinCode}</span
				>
			{/if}
		</div>
		<div
			class="col-span-2 col-start-3 row-span-2 row-start-2 flex h-full w-full items-center justify-center"
		>
			<Button size="lg">Modify Team</Button>
		</div>
	</Card.Footer>
</Card.Root>
