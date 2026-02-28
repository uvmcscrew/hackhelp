<script lang="ts">
	import { createQuery, createMutation } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Users from 'lucide-svelte/icons/users';
	import Group from 'lucide-svelte/icons/users-round';
	import Trophy from 'lucide-svelte/icons/trophy';
	import GraduationCap from 'lucide-svelte/icons/graduation-cap';
	import Ticket from 'lucide-svelte/icons/ticket';
	import CircleDot from 'lucide-svelte/icons/circle-dot';
	import Loader from 'lucide-svelte/icons/loader';
	import CheckCircle from 'lucide-svelte/icons/check-circle';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import Github from 'lucide-svelte/icons/github';

	const statsQuery = createQuery(() => orpc.admin.stats.queryOptions());

	type SyncReport = {
		teamsCreated: string[];
		teamsDeleted: string[];
		membersAdded: string[];
		membersRemoved: string[];
		mentorRolesAssigned: string[];
		mentorRolesRemoved: string[];
		errors: string[];
	};

	let syncReport = $state<SyncReport | null>(null);

	const syncMutation = createMutation(() =>
		orpc.admin.syncAllGithubPermissions.mutationOptions({
			onSuccess(data) {
				syncReport = data;
			}
		})
	);
</script>

<svelte:head>
	<title>Admin Dashboard | HackHelp</title>
</svelte:head>

<div class="container mx-auto py-8">
	<div class="mb-8">
		<h1 class="text-2xl font-bold">Admin Dashboard</h1>
		<p class="text-muted-foreground text-sm">Overview of the hackathon.</p>
	</div>

	{#if statsQuery.isLoading}
		<p class="text-muted-foreground">Loading stats...</p>
	{:else if statsQuery.isError}
		<p class="text-destructive">Failed to load stats: {statsQuery.error.message}</p>
	{:else if statsQuery.data}
		{@const stats = statsQuery.data}

		<!-- Overview Cards -->
		<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<a href="/admin/users" class="group">
				<Card.Root class="group-hover:border-primary/50 transition-colors">
					<Card.Header class="flex flex-row items-center justify-between pb-2">
						<Card.Title class="text-sm font-medium">Total Users</Card.Title>
						<Users class="text-muted-foreground h-4 w-4" />
					</Card.Header>
					<Card.Content>
						<div class="text-2xl font-bold">{stats.users}</div>
					</Card.Content>
				</Card.Root>
			</a>

			<a href="/admin/teams" class="group">
				<Card.Root class="group-hover:border-primary/50 transition-colors">
					<Card.Header class="flex flex-row items-center justify-between pb-2">
						<Card.Title class="text-sm font-medium">Total Teams</Card.Title>
						<Group class="text-muted-foreground h-4 w-4" />
					</Card.Header>
					<Card.Content>
						<div class="text-2xl font-bold">{stats.teams}</div>
					</Card.Content>
				</Card.Root>
			</a>

			<a href="/admin/challenges" class="group">
				<Card.Root class="group-hover:border-primary/50 transition-colors">
					<Card.Header class="flex flex-row items-center justify-between pb-2">
						<Card.Title class="text-sm font-medium">Challenges</Card.Title>
						<Trophy class="text-muted-foreground h-4 w-4" />
					</Card.Header>
					<Card.Content>
						<div class="text-2xl font-bold">{stats.challenges}</div>
					</Card.Content>
				</Card.Root>
			</a>

			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">Active Mentors</Card.Title>
					<GraduationCap class="text-muted-foreground h-4 w-4" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{stats.mentors}</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Ticket Stats -->
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold">Tickets</h2>
			<Button variant="outline" size="sm" href="/mentor">View All Tickets</Button>
		</div>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">Total</Card.Title>
					<Ticket class="text-muted-foreground h-4 w-4" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{stats.tickets.total}</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">Open</Card.Title>
					<CircleDot class="h-4 w-4 text-yellow-500" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{stats.tickets.open}</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">Claimed</Card.Title>
					<CircleDot class="h-4 w-4 text-blue-500" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{stats.tickets.claimed}</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">In Progress</Card.Title>
					<Loader class="h-4 w-4 text-purple-500" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{stats.tickets.inProgress}</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between pb-2">
					<Card.Title class="text-sm font-medium">Resolved</Card.Title>
					<CheckCircle class="h-4 w-4 text-green-500" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{stats.tickets.resolved}</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- GitHub Sync -->
		<div class="mt-8">
			<div class="mb-4 flex items-center justify-between">
				<div>
					<h2 class="text-lg font-semibold">GitHub Sync</h2>
					<p class="text-muted-foreground text-sm">
						Sync team memberships and mentor org roles to GitHub.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					disabled={syncMutation.isPending}
					onclick={() => syncMutation.mutate({})}
				>
					{#if syncMutation.isPending}
						<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
						Syncing...
					{:else}
						<Github class="mr-2 h-4 w-4" />
						Sync All GitHub Permissions
					{/if}
				</Button>
			</div>

			{#if syncReport}
				<Card.Root>
					<Card.Header class="pb-3">
						<Card.Title class="text-sm font-medium">Sync Results</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-2 text-sm">
						{#if syncReport.teamsCreated.length > 0}
							<p>
								<span class="font-medium text-green-600">Teams created:</span>
								{syncReport.teamsCreated.join(', ')}
							</p>
						{/if}
						{#if syncReport.membersAdded.length > 0}
							<p>
								<span class="font-medium text-green-600">Members added:</span>
								{syncReport.membersAdded.join(', ')}
							</p>
						{/if}
						{#if syncReport.membersRemoved.length > 0}
							<p>
								<span class="font-medium text-yellow-600">Members removed:</span>
								{syncReport.membersRemoved.join(', ')}
							</p>
						{/if}
						{#if syncReport.mentorRolesAssigned.length > 0}
							<p>
								<span class="font-medium text-green-600">Mentor roles assigned:</span>
								{syncReport.mentorRolesAssigned.join(', ')}
							</p>
						{/if}
						{#if syncReport.mentorRolesRemoved.length > 0}
							<p>
								<span class="font-medium text-yellow-600">Mentor roles removed:</span>
								{syncReport.mentorRolesRemoved.join(', ')}
							</p>
						{/if}
						{#if syncReport.errors.length > 0}
							<div>
								<span class="font-medium text-red-600">Errors:</span>
								<ul class="text-destructive mt-1 list-inside list-disc">
									{#each syncReport.errors as error}
										<li>{error}</li>
									{/each}
								</ul>
							</div>
						{/if}
						{#if syncReport.teamsCreated.length === 0 && syncReport.membersAdded.length === 0 && syncReport.membersRemoved.length === 0 && syncReport.mentorRolesAssigned.length === 0 && syncReport.mentorRolesRemoved.length === 0 && syncReport.errors.length === 0}
							<p class="text-muted-foreground">Everything is already in sync.</p>
						{/if}
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	{/if}
</div>
