<script lang="ts">
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

	let canJoinState = $state($team.data.team.canJoin);
</script>

<Card.Root class="col-span-1 col-start-1 row-span-1 row-start-1">
	<Card.Header>
		<Card.Title>My Team</Card.Title>
	</Card.Header>
	<Card.Content>
		<h2 class="text-2xl font-semibold">{$team.data.team.name}</h2>
	</Card.Content>
	<Card.Footer class="grid w-fit grid-cols-2 grid-rows-3">
		<span class="text-muted-foreground col-span-2 row-start-1 text-base">Join Details</span>
		<div class="row-start-2 inline-flex items-center">
			<Label for="canJoin" class="text-base">Can Join</Label>
		</div>
		<div class="col-start-2 row-start-2 inline-flex items-center">
			<Switch id="canJoin" class="ml-2" bind:checked={canJoinState} />
		</div>
		<div class="row-start-3 inline-flex items-center">
			<span class="text-base font-medium">Join Code:</span>
		</div>
		<div class="col-start-2 row-start-3 inline-flex items-center">
			<span class="bg-accent text-accent-foreground ml-2 rounded-sm p-1 font-mono"
				>{$team.data.team.joinCode}</span
			>
		</div>
	</Card.Footer>
</Card.Root>
