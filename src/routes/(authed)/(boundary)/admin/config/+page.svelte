<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';

	const qc = useQueryClient();

	// ── Event Timing Config ──
	const eventTimingQuery = createQuery(() => orpc.config.view.eventTiming.queryOptions());

	let etEventPrep = $state('');
	let etEventStart = $state('');
	let etCompetitionStart = $state('');
	let etCompetitionEnd = $state('');
	let etRegistrationDeadline = $state('');
	let etEditing = $state(false);

	function startEditEventTiming() {
		const d = eventTimingQuery.data;
		if (!d) return;
		etEventPrep = toLocalDatetimeString(new Date(d.eventPrep));
		etEventStart = toLocalDatetimeString(new Date(d.eventStart));
		etCompetitionStart = toLocalDatetimeString(new Date(d.competitionStart));
		etCompetitionEnd = toLocalDatetimeString(new Date(d.competitionEnd));
		etRegistrationDeadline = toLocalDatetimeString(new Date(d.registrationDeadline));
		etEditing = true;
	}

	const updateEventTimingMut = createMutation(() =>
		orpc.config.update.eventTiming.mutationOptions({
			onSuccess: () => {
				etEditing = false;
				qc.invalidateQueries({ queryKey: orpc.config.view.eventTiming.queryKey() });
			}
		})
	);

	function saveEventTiming() {
		updateEventTimingMut.mutate({
			eventPrep: new Date(etEventPrep),
			eventStart: new Date(etEventStart),
			competitionStart: new Date(etCompetitionStart),
			competitionEnd: new Date(etCompetitionEnd),
			registrationDeadline: new Date(etRegistrationDeadline)
		});
	}

	// ── Challenge Config ──
	const challengeConfigQuery = createQuery(() => orpc.config.view.challenges.queryOptions());

	let ccViewFrom = $state('');
	let ccViewNow = $state(false);
	let ccRegisterFrom = $state('');
	let ccRegisterNow = $state(false);
	let ccMaxTeams = $state(10);
	let ccEditing = $state(false);

	function startEditChallengeConfig() {
		const d = challengeConfigQuery.data;
		if (!d) return;
		ccViewFrom = toLocalDatetimeString(new Date(d.challengesViewAvailableFrom));
		ccViewNow = d.challengesViewAvailableNow;
		ccRegisterFrom = toLocalDatetimeString(new Date(d.challengesRegisterAvailableFrom));
		ccRegisterNow = d.challengesRegisterAvailableNow;
		ccMaxTeams = d.maxTeamsPerChallenge;
		ccEditing = true;
	}

	const updateChallengeConfigMut = createMutation(() =>
		orpc.config.update.challenges.mutationOptions({
			onSuccess: () => {
				ccEditing = false;
				qc.invalidateQueries({ queryKey: orpc.config.view.challenges.queryKey() });
			}
		})
	);

	function saveChallengeConfig() {
		updateChallengeConfigMut.mutate({
			challengesViewAvailableFrom: new Date(ccViewFrom),
			challengesViewAvailableNow: ccViewNow,
			challengesRegisterAvailableFrom: new Date(ccRegisterFrom),
			challengesRegisterAvailableNow: ccRegisterNow,
			maxTeamsPerChallenge: ccMaxTeams
		});
	}

	// ── Participants Config ──
	const participantsConfigQuery = createQuery(() => orpc.config.view.participants.queryOptions());

	let pcMaxParticipants = $state(100);
	let pcTeamSizeMin = $state(4);
	let pcTeamSizeMax = $state(6);
	let pcEditing = $state(false);

	function startEditParticipantsConfig() {
		const d = participantsConfigQuery.data;
		if (!d) return;
		pcMaxParticipants = d.maxParticipants;
		pcTeamSizeMin = d.teamSizeMin;
		pcTeamSizeMax = d.teamSizeMax;
		pcEditing = true;
	}

	const updateParticipantsConfigMut = createMutation(() =>
		orpc.config.update.participants.mutationOptions({
			onSuccess: () => {
				pcEditing = false;
				qc.invalidateQueries({ queryKey: orpc.config.view.participants.queryKey() });
			}
		})
	);

	function saveParticipantsConfig() {
		updateParticipantsConfigMut.mutate({
			maxParticipants: pcMaxParticipants,
			teamSizeMin: pcTeamSizeMin,
			teamSizeMax: pcTeamSizeMax
		});
	}

	// ── Helpers ──
	function toLocalDatetimeString(d: Date): string {
		const offset = d.getTimezoneOffset();
		const local = new Date(d.getTime() - offset * 60000);
		return local.toISOString().slice(0, 16);
	}

	function formatDate(d: unknown): string {
		if (!d) return 'Not set';
		const date = d instanceof Date ? d : new Date(d as string);
		return date.toLocaleString();
	}
</script>

<svelte:head>
	<title>Configuration</title>
</svelte:head>

<div class="container mx-auto max-w-2xl py-8">
	<h1 class="mb-6 text-2xl font-bold">Configuration</h1>

	<!-- Event Timing -->
	<Card.Root class="mb-6">
		<Card.Header>
			<div class="flex items-center justify-between">
				<Card.Title>Event Timing</Card.Title>
				{#if !etEditing}
					<Button
						variant="outline"
						size="sm"
						onclick={startEditEventTiming}
						disabled={eventTimingQuery.isLoading}
					>
						Edit
					</Button>
				{/if}
			</div>
			<Card.Description
				>Controls when event pages, challenges, and features become available.</Card.Description
			>
		</Card.Header>
		<Card.Content>
			{#if eventTimingQuery.isLoading}
				<p class="text-muted-foreground text-sm">Loading...</p>
			{:else if eventTimingQuery.isError}
				<p class="text-destructive text-sm">Failed to load event timing config.</p>
			{:else if etEditing}
				<div class="flex flex-col gap-4">
					<div class="space-y-1.5">
						<Label>Event Prep (pages become accessible)</Label>
						<Input type="datetime-local" bind:value={etEventPrep} />
					</div>
					<div class="space-y-1.5">
						<Label>Event Start (challenges visible)</Label>
						<Input type="datetime-local" bind:value={etEventStart} />
					</div>
					<div class="space-y-1.5">
						<Label>Competition Start</Label>
						<Input type="datetime-local" bind:value={etCompetitionStart} />
					</div>
					<div class="space-y-1.5">
						<Label>Competition End</Label>
						<Input type="datetime-local" bind:value={etCompetitionEnd} />
					</div>
					<div class="space-y-1.5">
						<Label>Registration Deadline</Label>
						<Input type="datetime-local" bind:value={etRegistrationDeadline} />
					</div>
					<div class="flex gap-2">
						<Button onclick={saveEventTiming} disabled={updateEventTimingMut.isPending}>
							{updateEventTimingMut.isPending ? 'Saving...' : 'Save'}
						</Button>
						<Button variant="ghost" onclick={() => (etEditing = false)}>Cancel</Button>
					</div>
					{#if updateEventTimingMut.isError}
						<p class="text-destructive text-sm">{updateEventTimingMut.error.message}</p>
					{/if}
				</div>
			{:else if eventTimingQuery.data}
				{@const d = eventTimingQuery.data}
				<div class="flex flex-col gap-3 text-sm">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Event Prep</span>
						<span class="font-medium">{formatDate(d.eventPrep)}</span>
					</div>
					<Separator />
					<div class="flex justify-between">
						<span class="text-muted-foreground">Event Start</span>
						<span class="font-medium">{formatDate(d.eventStart)}</span>
					</div>
					<Separator />
					<div class="flex justify-between">
						<span class="text-muted-foreground">Competition Start</span>
						<span class="font-medium">{formatDate(d.competitionStart)}</span>
					</div>
					<Separator />
					<div class="flex justify-between">
						<span class="text-muted-foreground">Competition End</span>
						<span class="font-medium">{formatDate(d.competitionEnd)}</span>
					</div>
					<Separator />
					<div class="flex justify-between">
						<span class="text-muted-foreground">Registration Deadline</span>
						<span class="font-medium">{formatDate(d.registrationDeadline)}</span>
					</div>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Challenge Config -->
	<Card.Root class="mb-6">
		<Card.Header>
			<div class="flex items-center justify-between">
				<Card.Title>Challenge Visibility</Card.Title>
				{#if !ccEditing}
					<Button
						variant="outline"
						size="sm"
						onclick={startEditChallengeConfig}
						disabled={challengeConfigQuery.isLoading}
					>
						Edit
					</Button>
				{/if}
			</div>
			<Card.Description
				>Controls when challenges become visible and when teams can register.</Card.Description
			>
		</Card.Header>
		<Card.Content>
			{#if challengeConfigQuery.isLoading}
				<p class="text-muted-foreground text-sm">Loading...</p>
			{:else if challengeConfigQuery.isError}
				<p class="text-destructive text-sm">Failed to load challenge config.</p>
			{:else if ccEditing}
				<div class="flex flex-col gap-4">
					<div class="flex items-center gap-3">
						<input type="checkbox" bind:checked={ccViewNow} id="ccViewNow" />
						<Label for="ccViewNow">Challenges visible now (override)</Label>
					</div>
					<div class="space-y-1.5">
						<Label>Challenges visible from</Label>
						<Input type="datetime-local" bind:value={ccViewFrom} />
					</div>
					<Separator />
					<div class="flex items-center gap-3">
						<input type="checkbox" bind:checked={ccRegisterNow} id="ccRegisterNow" />
						<Label for="ccRegisterNow">Registration open now (override)</Label>
					</div>
					<div class="space-y-1.5">
						<Label>Registration open from</Label>
						<Input type="datetime-local" bind:value={ccRegisterFrom} />
					</div>
					<Separator />
					<div class="space-y-1.5">
						<Label>Max teams per challenge</Label>
						<Input type="number" bind:value={ccMaxTeams} min={1} />
					</div>
					<div class="flex gap-2">
						<Button onclick={saveChallengeConfig} disabled={updateChallengeConfigMut.isPending}>
							{updateChallengeConfigMut.isPending ? 'Saving...' : 'Save'}
						</Button>
						<Button variant="ghost" onclick={() => (ccEditing = false)}>Cancel</Button>
					</div>
					{#if updateChallengeConfigMut.isError}
						<p class="text-destructive text-sm">{updateChallengeConfigMut.error.message}</p>
					{/if}
				</div>
			{:else if challengeConfigQuery.data}
				{@const d = challengeConfigQuery.data}
				<div class="flex flex-col gap-3 text-sm">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Visible now (override)</span>
						<span class="font-medium">{d.challengesViewAvailableNow ? 'Yes' : 'No'}</span>
					</div>
					<Separator />
					<div class="flex justify-between">
						<span class="text-muted-foreground">Visible from</span>
						<span class="font-medium">{formatDate(d.challengesViewAvailableFrom)}</span>
					</div>
					<Separator />
					<div class="flex justify-between">
						<span class="text-muted-foreground">Registration open (override)</span>
						<span class="font-medium">{d.challengesRegisterAvailableNow ? 'Yes' : 'No'}</span>
					</div>
					<Separator />
					<div class="flex justify-between">
						<span class="text-muted-foreground">Registration from</span>
						<span class="font-medium">{formatDate(d.challengesRegisterAvailableFrom)}</span>
					</div>
					<Separator />
					<div class="flex justify-between">
						<span class="text-muted-foreground">Max teams per challenge</span>
						<span class="font-medium">{d.maxTeamsPerChallenge}</span>
					</div>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Participants Config -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between">
				<Card.Title>Participants</Card.Title>
				{#if !pcEditing}
					<Button
						variant="outline"
						size="sm"
						onclick={startEditParticipantsConfig}
						disabled={participantsConfigQuery.isLoading}
					>
						Edit
					</Button>
				{/if}
			</div>
			<Card.Description>Controls participant limits and team size constraints.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if participantsConfigQuery.isLoading}
				<p class="text-muted-foreground text-sm">Loading...</p>
			{:else if participantsConfigQuery.isError}
				<p class="text-destructive text-sm">Failed to load participants config.</p>
			{:else if pcEditing}
				<div class="flex flex-col gap-4">
					<div class="space-y-1.5">
						<Label>Max Participants</Label>
						<Input type="number" bind:value={pcMaxParticipants} min={1} />
					</div>
					<div class="space-y-1.5">
						<Label>Min Team Size</Label>
						<Input type="number" bind:value={pcTeamSizeMin} min={1} />
					</div>
					<div class="space-y-1.5">
						<Label>Max Team Size</Label>
						<Input type="number" bind:value={pcTeamSizeMax} min={1} />
					</div>
					<div class="flex gap-2">
						<Button
							onclick={saveParticipantsConfig}
							disabled={updateParticipantsConfigMut.isPending}
						>
							{updateParticipantsConfigMut.isPending ? 'Saving...' : 'Save'}
						</Button>
						<Button variant="ghost" onclick={() => (pcEditing = false)}>Cancel</Button>
					</div>
					{#if updateParticipantsConfigMut.isError}
						<p class="text-destructive text-sm">{updateParticipantsConfigMut.error.message}</p>
					{/if}
				</div>
			{:else if participantsConfigQuery.data}
				{@const d = participantsConfigQuery.data}
				<div class="flex flex-col gap-3 text-sm">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Max Participants</span>
						<span class="font-medium">{d.maxParticipants}</span>
					</div>
					<Separator />
					<div class="flex justify-between">
						<span class="text-muted-foreground">Min Team Size</span>
						<span class="font-medium">{d.teamSizeMin}</span>
					</div>
					<Separator />
					<div class="flex justify-between">
						<span class="text-muted-foreground">Max Team Size</span>
						<span class="font-medium">{d.teamSizeMax}</span>
					</div>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
