<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import type { RouterOutputs } from '$lib/orpc/server';
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';
	import Pencil from 'lucide-svelte/icons/pencil';
	import {
		TEAM_MAX_SIZE,
		PROGRAMMERS_MIN,
		PROGRAMMERS_MAX,
		BUSINESS_MIN,
		BUSINESS_MAX
	} from '$lib/config/team-rules';
	import MapPin from 'lucide-svelte/icons/map-pin';

	type Props = {
		team: NonNullable<RouterOutputs['teams']['myTeam']>;
	};

	let { team }: Props = $props();

	const isCaptain = $derived(team.myMembership.isCaptain);

	const programmers = $derived(team.members.filter((m) => m.membership.role === 'programming'));
	const programmerCountCorrect = $derived(
		programmers.length >= PROGRAMMERS_MIN && programmers.length <= PROGRAMMERS_MAX
	);
	const business = $derived(team.members.filter((m) => m.membership.role === 'business'));
	const businessCountCorrect = $derived(
		business.length >= BUSINESS_MIN && business.length <= BUSINESS_MAX
	);

	function copyJoinCode(code: string) {
		void navigator.clipboard.writeText(code);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	let copied = $state(false);

	// Inline name editing (captain only)
	const queryClient = useQueryClient();
	let editingName = $state(false);
	let nameInput = $state('');

	const updateNameMut = createMutation(() =>
		orpc.teams.updateName.mutationOptions({
			onSuccess: async () => {
				editingName = false;
				await queryClient.invalidateQueries({ queryKey: orpc.teams.myTeam.queryKey() });
			}
		})
	);

	function startEditName() {
		nameInput = team.name;
		editingName = true;
	}

	function saveName() {
		if (!nameInput.trim()) return;
		updateNameMut.mutate({ name: nameInput.trim() });
	}
</script>

<Card.Root>
	<Card.Header>
		<div class="flex items-center justify-between">
			{#if editingName}
				<div class="flex flex-1 items-center gap-2">
					<Input
						bind:value={nameInput}
						class="max-w-xs"
						minlength={3}
						maxlength={50}
						onkeydown={(e) => {
							if (e.key === 'Enter') saveName();
							if (e.key === 'Escape') editingName = false;
						}}
					/>
					<Button
						size="sm"
						onclick={saveName}
						disabled={updateNameMut.isPending || !nameInput.trim()}
					>
						Save
					</Button>
					<Button size="sm" variant="ghost" onclick={() => (editingName = false)}>Cancel</Button>
				</div>
			{:else}
				<div class="flex items-center gap-2">
					<Card.Title class="text-xl">{team.name}</Card.Title>
					{#if isCaptain}
						<Button variant="ghost" size="icon" class="h-8 w-8" onclick={startEditName}>
							<Pencil class="h-4 w-4" />
						</Button>
					{/if}
				</div>
			{/if}
			<div class="flex gap-2">
				{#if isCaptain}
					<Badge variant="default">Captain</Badge>
				{/if}
				<Badge variant="secondary">{team.myMembership.role}</Badge>
			</div>
		</div>
		{#if updateNameMut.isError}
			<p class="text-destructive text-sm">{updateNameMut.error.message}</p>
		{/if}
	</Card.Header>
	<Card.Content class="flex flex-col gap-5">
		<!-- Join Code -->
		<div class="flex flex-col gap-1.5">
			<span class="text-muted-foreground text-sm font-medium">Join Code</span>
			<div class="flex items-center gap-3">
				<code
					style={`background:#${team.joinCode}`}
					class="bg-muted rounded px-3 py-1.5 font-mono text-lg tracking-widest"
				>
					{team.joinCode}
				</code>
				<Button variant="outline" size="sm" onclick={() => copyJoinCode(team.joinCode)}>
					{copied ? 'Copied!' : 'Copy'}
				</Button>
			</div>
			<span class="text-muted-foreground text-xs">
				Share this code with teammates so they can join.
			</span>
		</div>

		<!-- Location -->
		{#if team.room || team.locationDescription}
			<div class="flex flex-col gap-1.5">
				<span class="text-muted-foreground text-sm font-medium">Location</span>
				<div class="flex items-center gap-2">
					<MapPin class="text-muted-foreground h-4 w-4 shrink-0" />
					<div class="flex flex-col">
						{#if team.room}
							<span class="text-sm font-medium">Room {team.room}</span>
						{/if}
						{#if team.locationDescription}
							<span class="text-muted-foreground text-sm">{team.locationDescription}</span>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Status Badges -->
		<div class="flex flex-wrap gap-2">
			{#if team.canJoin}
				<Badge variant="green" hoverEffects={false}>Open for joining</Badge>
			{:else}
				<Badge variant="secondary" hoverEffects={false}>Closed</Badge>
			{/if}
			{#if team.isPublic}
				<Badge variant="green" hoverEffects={false}>Public</Badge>
			{:else}
				<Badge variant="secondary" hoverEffects={false}>Private</Badge>
			{/if}
			<Badge
				variant={programmerCountCorrect && businessCountCorrect ? 'green' : 'secondary'}
				hoverEffects={false}
			>
				{team.members.length}/{TEAM_MAX_SIZE} members
			</Badge>
			<Badge variant={programmerCountCorrect ? 'green' : 'destructive'} hoverEffects={false}>
				{programmers.length}/{PROGRAMMERS_MAX} programmers
			</Badge>
			<Badge variant={businessCountCorrect ? 'green' : 'destructive'} hoverEffects={false}>
				{business.length}/{BUSINESS_MAX} business
			</Badge>
		</div>
	</Card.Content>
</Card.Root>
