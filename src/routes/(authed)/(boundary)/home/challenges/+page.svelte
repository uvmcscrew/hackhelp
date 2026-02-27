<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { onDestroy } from 'svelte';
	import { cn } from '$lib/utils';

	const queryClient = useQueryClient();

	// Track whether challenges are visible to control polling
	let challengesRevealed = $state(false);

	// Query 1: lightweight availability check, polls every 2s until visible
	const availabilityQuery = createQuery(() => ({
		...orpc.challenges.availability.queryOptions(),
		refetchInterval: challengesRevealed ? false : 2000
	}));

	// Update revealed flag when availability changes
	$effect(() => {
		if (availabilityQuery.data?.visible) {
			challengesRevealed = true;
		}
	});

	const isVisible = $derived(availabilityQuery.data?.visible ?? false);
	const availableFrom = $derived(
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		availabilityQuery.data?.availableFrom ? new Date(availabilityQuery.data.availableFrom) : null
	);

	// Query 2: full challenge data, only enabled once visible, polls every 2s
	const challengesQuery = createQuery(() => ({
		...orpc.challenges.list.queryOptions(),
		enabled: isVisible,
		refetchInterval: 1_000
	}));

	const myTeamQuery = createQuery(() => orpc.teams.myTeam.queryOptions());

	const selectChallengeMut = createMutation(() =>
		orpc.challenges.selectForTeam.mutationOptions({
			onSuccess: async () => {
				await Promise.all([
					queryClient.invalidateQueries({ queryKey: orpc.teams.myTeam.queryKey() }),
					queryClient.invalidateQueries({ queryKey: orpc.challenges.list.queryKey() })
				]);
			}
		})
	);

	// Countdown logic
	let now = $state(new Date());
	const interval = setInterval(() => (now = new Date()), 1000);
	onDestroy(() => clearInterval(interval));

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
	const maxTeams = $derived(challengesQuery.data?.maxTeamsPerChallenge ?? 0);
	const canRegister = $derived(challengesQuery.data?.canRegister ?? false);

	function handleSelect(challengeId: string) {
		if (confirm('Select this challenge for your team?')) {
			selectChallengeMut.mutate({ challengeId });
		}
	}
</script>

<svelte:head>
	<title>Challenges</title>
</svelte:head>

<div class="container w-screen px-6">
	{#if availabilityQuery.isLoading}
		<p class="text-muted-foreground">Loading...</p>
	{:else if availabilityQuery.isError}
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

		{#if challengesQuery.isLoading}
			<p class="text-muted-foreground">Loading challenges...</p>
		{:else if challengesQuery.data && challengesQuery.data.challenges.length === 0}
			<p class="text-muted-foreground">No challenges have been posted yet.</p>
		{:else if challengesQuery.data}
			<h1 class="mt-2 w-full animate-spin p-16 text-center text-4xl font-bold italic">
				CHALLENGES
			</h1>
			<div class="flex w-full flex-row gap-x-4 py-2">
				{#each challengesQuery.data.challenges as challenge (challenge.id)}
					{@const isSelected = selectedChallengeId === challenge.id}
					{@const isFull = maxTeams > 0 && challenge.teamCount >= maxTeams}
					<Card.Root class={cn('basis-1/3', isSelected ? 'ring-primary ring-2' : '')}>
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
							<Card.Footer class="flex flex-col items-start gap-1">
								{#if !canRegister}
									<p class="text-muted-foreground text-xs">Challenge selection is not open yet.</p>
								{/if}
								<Button
									size="sm"
									onclick={() => handleSelect(challenge.id)}
									disabled={selectChallengeMut.isPending || isFull || !canRegister}
								>
									{#if selectChallengeMut.isPending}
										Selecting...
									{:else if isFull}
										Full
									{:else if !canRegister}
										Selection Not Open
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
