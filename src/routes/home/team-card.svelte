<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import type { RouterOutputs } from '$lib/orpc/server';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import TeamModifySheet from './team-modify-sheet.svelte';
	import { createMutation, createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';

	type Props = {
		teamData: RouterOutputs['competitor']['team']['getTeam'];
	};

	let { teamData }: Props = $props();

	let team = createQuery(orpc.competitor.team.getTeam.queryOptions);

	let teamJoinStateMutation = createMutation(orpc.competitor.team.updateJoinable.mutationOptions);

	let canJoinState = $state(team.data?.team.canJoin ?? false);
	let canJoinEnabled = $state(true);
</script>

<Card.Root class="col-span-1 col-start-1 row-span-1 row-start-1 flex flex-col">
	<Card.Header>
		<Card.Title>My Team</Card.Title>
	</Card.Header>
	<Card.Content class="h-max grow">
		<h2 class="text-2xl font-semibold">{team.data?.team.name}</h2>
	</Card.Content>
	<Card.Footer class=" grid grid-cols-2 grid-rows-4 gap-y-2 lg:grid-cols-4 lg:grid-rows-3">
		<span class="text-muted-foreground col-span-2 row-start-1 text-base">Join Details</span>
		<div class="row-start-2 inline-flex items-center">
			<Label for="canJoin" class="text-base">Can Join</Label>
		</div>
		<div class="col-start-1 row-start-3 inline-flex items-center lg:col-start-2 lg:row-start-2">
			<Switch
				id="canJoin"
				class="mr-2"
				checked={canJoinState}
				disabled={!canJoinEnabled}
				title={canJoinEnabled
					? canJoinState
						? 'Anyone with the code can join'
						: 'Click to enable joining'
					: 'Disabled for a few seconds to prevent spam'}
				onCheckedChange={async (checked) => {
					canJoinState = false;
					canJoinEnabled = false;
					const { teamIsJoinable } = await teamJoinStateMutation.mutateAsync({
						canJoin: checked
					});
					canJoinState = teamIsJoinable;
					setTimeout(() => {
						canJoinEnabled = true;
					}, 1000);
				}}
			/>
			{#if teamJoinStateMutation.isPending}
				<LoaderCircle class="h-6 w-6 animate-spin" />
			{/if}
		</div>
		<div class="col-start-2 row-start-2 inline-flex items-center lg:col-start-1 lg:row-start-3">
			{#if canJoinState}
				<span class="text-base font-medium">Join Code</span>
			{/if}
		</div>
		<div class="col-start-2 row-start-3 inline-flex h-8 items-center">
			{#if canJoinState}
				<span class="bg-accent text-accent-foreground rounded-sm p-1 font-mono"
					>{team.data?.team.joinCode}</span
				>
			{/if}
		</div>
		<div
			class="col-span-2 col-start-1 row-span-2 row-start-4 flex h-full w-full items-center justify-center lg:col-start-3 lg:row-start-2"
		>
			<TeamModifySheet />
		</div>
	</Card.Footer>
</Card.Root>
