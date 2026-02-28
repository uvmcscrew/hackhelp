<svelte:options runes={true} />

<script lang="ts">
	import { createQuery, createMutation } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import TeamsTable from './_components/teams-table.svelte';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';

	const teamsQuery = createQuery(() => orpc.admin.teams.all.queryOptions());

	// ── Sync All Teams ──
	const syncAllMut = createMutation(() => orpc.admin.teams.syncAllToGithub.mutationOptions());
</script>

<svelte:head>
	<title>Teams Administration | HackHelp</title>
</svelte:head>

<div class="container mx-auto py-8">
	<div class="mb-6 flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold">Teams</h1>
			<p class="text-muted-foreground text-sm">Manage all teams.</p>
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				onclick={() => syncAllMut.mutate({})}
				disabled={syncAllMut.isPending}
			>
				<RefreshCw class="mr-2 h-4 w-4 {syncAllMut.isPending ? 'animate-spin' : ''}" />
				{syncAllMut.isPending ? 'Syncing...' : 'Sync All to GitHub'}
			</Button>
			<Button href="/admin/teams/create">Create Team</Button>
		</div>
	</div>

	{#if syncAllMut.isSuccess}
		{@const report = syncAllMut.data}
		<Card.Root class="mb-6">
			<Card.Header>
				<Card.Title class="text-base">GitHub Sync Report</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="mb-2 flex flex-wrap gap-2">
					{#if report.teamsCreated.length > 0}
						<Badge variant="green">Teams created: {report.teamsCreated.length}</Badge>
					{/if}
					{#if report.membersAdded.length > 0}
						<Badge variant="green">Members added: {report.membersAdded.length}</Badge>
					{/if}
					{#if report.membersRemoved.length > 0}
						<Badge variant="secondary">Members removed: {report.membersRemoved.length}</Badge>
					{/if}
					{#if report.errors.length > 0}
						<Badge variant="destructive">Errors: {report.errors.length}</Badge>
					{/if}
					{#if report.teamsCreated.length === 0 && report.membersAdded.length === 0 && report.membersRemoved.length === 0 && report.errors.length === 0}
						<span class="text-muted-foreground text-sm">Everything is in sync.</span>
					{/if}
				</div>
				{#if report.teamsCreated.length > 0}
					<p class="text-sm">
						<span class="font-medium">Teams created:</span>
						{report.teamsCreated.join(', ')}
					</p>
				{/if}
				{#if report.membersAdded.length > 0}
					<p class="text-sm">
						<span class="font-medium">Members added:</span>
						{report.membersAdded.join(', ')}
					</p>
				{/if}
				{#if report.membersRemoved.length > 0}
					<p class="text-sm">
						<span class="font-medium">Members removed:</span>
						{report.membersRemoved.join(', ')}
					</p>
				{/if}
				{#if report.errors.length > 0}
					<div class="mt-2">
						<p class="text-destructive text-sm font-medium">Errors:</p>
						<ul class="text-destructive list-disc pl-5 text-sm">
							{#each report.errors as error}
								<li>{error}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}

	{#if syncAllMut.isError}
		<Card.Root class="border-destructive mb-6">
			<Card.Content class="py-4">
				<p class="text-destructive text-sm">Sync failed: {syncAllMut.error.message}</p>
			</Card.Content>
		</Card.Root>
	{/if}

	<TeamsTable teams={teamsQuery.data?.teams || []} />
</div>
