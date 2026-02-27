<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { onDestroy } from 'svelte';

	const queryClient = useQueryClient();

	const challengesQuery = createQuery(() => orpc.challenges.list.queryOptions());
	const myTeamQuery = createQuery(() => orpc.teams.myTeam.queryOptions());

	const selectChallengeMut = createMutation(() =>
		orpc.challenges.selectForTeam.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: orpc.teams.myTeam.queryKey() });
			}
		})
	);

	// Countdown logic
	let now = $state(new Date());
	const interval = setInterval(() => (now = new Date()), 1000);
	onDestroy(() => clearInterval(interval));

	const challengesData = $derived(challengesQuery.data);
	const isVisible = $derived(challengesData?.visible ?? false);
	const availableFrom = $derived(
		challengesData?.availableFrom ? new Date(challengesData.availableFrom) : null
	);

	const timeRemaining = $derived.by(() => {
		if (!availableFrom || isVisible) return null;
		const diff = availableFrom.getTime() - now.getTime();
		if (diff <= 0) return null;

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);
		return { days, hours, minutes, seconds };
	});

	const isCaptain = $derived(myTeamQuery.data?.myMembership?.isCaptain ?? false);
	const selectedChallengeId = $derived(myTeamQuery.data?.selectedChallengeId ?? null);
	const maxTeams = $derived(challengesData?.maxTeamsPerChallenge ?? 0);

	function handleSelect(challengeId: string) {
		if (confirm('Select this challenge for your team?')) {
			selectChallengeMut.mutate({ challengeId });
		}
	}
</script>

<svelte:head>
	<title>Challenges</title>
</svelte:head>

<div class="container mx-auto flex max-w-5xl flex-col gap-6 py-8">
	<h1 class="text-2xl font-bold">Challenges</h1>

	{#if challengesQuery.isLoading}
		<p class="text-muted-foreground">Loading...</p>
	{:else if challengesQuery.isError}
		<p class="text-destructive">Failed to load challenges.</p>
	{:else if !isVisible}
		<!-- Countdown state -->
		<Card.Root class="mx-auto max-w-lg text-center">
			<Card.Header>
				<Card.Title class="text-xl">Challenges Coming Soon</Card.Title>
				<Card.Description>Challenges will be revealed when the event starts.</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if timeRemaining}
					<div class="flex justify-center gap-4">
						{#each [{ label: 'Days', value: timeRemaining.days }, { label: 'Hours', value: timeRemaining.hours }, { label: 'Minutes', value: timeRemaining.minutes }, { label: 'Seconds', value: timeRemaining.seconds }] as segment (segment.label)}
							<div class="flex flex-col items-center">
								<span class="text-4xl font-bold tabular-nums">
									{String(segment.value).padStart(2, '0')}
								</span>
								<span class="text-muted-foreground text-xs">{segment.label}</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-muted-foreground text-sm">
						Challenges should be available very soon. Try refreshing the page.
					</p>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else}
		<!-- Challenges visible -->
		{#if selectChallengeMut.isError}
			<p class="text-destructive text-sm">{selectChallengeMut.error.message}</p>
		{/if}

		{#if challengesData && challengesData.challenges.length === 0}
			<p class="text-muted-foreground">No challenges have been posted yet.</p>
		{:else if challengesData}
			<div class="grid gap-6 md:grid-cols-3">
				{#each challengesData.challenges as challenge (challenge.id)}
					{@const isSelected = selectedChallengeId === challenge.id}
					{@const isFull = maxTeams > 0 && challenge.teamCount >= maxTeams}
					<Card.Root class={isSelected ? 'ring-primary ring-2' : ''}>
						<Card.Header>
							<div class="flex items-center justify-between">
								<Card.Title class="text-lg">{challenge.title}</Card.Title>
								<div class="flex items-center gap-1.5">
									{#if isSelected}
										<Badge variant="default">Selected</Badge>
									{/if}
									{#if isFull}
										<Badge variant="destructive">Full</Badge>
									{/if}
								</div>
							</div>
						</Card.Header>
						<Card.Content class="flex flex-col gap-3">
							{#if challenge.description}
								<p class="text-muted-foreground text-sm whitespace-pre-wrap">
									{challenge.description}
								</p>
							{:else}
								<p class="text-muted-foreground text-sm italic">No description provided.</p>
							{/if}

							{#if challenge.linkedRepo}
								<div>
									<a
										href="https://github.com/{challenge.linkedRepo}"
										target="_blank"
										rel="noopener noreferrer"
										class="text-primary text-sm underline"
									>
										{challenge.linkedRepo}
									</a>
								</div>
							{/if}

							<p class="text-muted-foreground text-xs">
								{challenge.teamCount} / {maxTeams} teams
							</p>
						</Card.Content>
						{#if isCaptain && !isSelected}
							<Card.Footer>
								<Button
									size="sm"
									onclick={() => handleSelect(challenge.id)}
									disabled={selectChallengeMut.isPending || isFull}
								>
									{#if selectChallengeMut.isPending}
										Selecting...
									{:else if isFull}
										Full
									{:else}
										Select Challenge
									{/if}
								</Button>
							</Card.Footer>
						{/if}
					</Card.Root>
				{/each}
			</div>
		{/if}
	{/if}
</div>
