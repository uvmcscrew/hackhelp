<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { TEAM_MAX_SIZE } from '$lib/config/team-rules';
	import TicketStatusBadge from '$lib/components/ticket-status-badge.svelte';
	import { clientEnv } from '$lib/env/client';

	const myTeamQuery = createQuery(() => orpc.teams.myTeam.queryOptions());

	const reposQuery = createQuery(() =>
		orpc.teams.repos.list.queryOptions({
			enabled: !!myTeamQuery.data?.githubSlug
		})
	);

	const ticketsQuery = createQuery(() =>
		orpc.tickets.myTeamTickets.queryOptions({
			enabled: !!myTeamQuery.data
		})
	);
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<div class="container mx-auto flex max-w-2xl flex-col gap-6 py-8">
	<h1 class="text-2xl font-bold">Dashboard</h1>

	{#if myTeamQuery.isLoading}
		<p class="text-muted-foreground">Loading...</p>
	{:else if myTeamQuery.data}
		{@const team = myTeamQuery.data}
		<Card.Root>
			<Card.Header>
				<div class="flex items-center justify-between">
					<Card.Title>{team.name}</Card.Title>
					{#if team.myMembership.isCaptain}
						<Badge variant="default">Captain</Badge>
					{/if}
				</div>
				<Card.Description>
					Your role: <Badge variant="secondary" hoverEffects={false}>{team.myMembership.role}</Badge
					>
				</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-col gap-4">
				<!-- Join Code -->
				<div class="flex flex-col gap-1">
					<span class="text-muted-foreground text-sm font-medium">Join Code</span>
					<code class="bg-muted w-fit rounded px-3 py-1.5 font-mono text-lg tracking-widest">
						{team.joinCode}
					</code>
					<span class="text-muted-foreground text-xs">
						Share this code with teammates so they can join.
					</span>
				</div>

				<!-- Members -->
				<div class="flex flex-col gap-2">
					<span class="text-muted-foreground text-sm font-medium">
						Members ({team.members.length}/{TEAM_MAX_SIZE})
					</span>
					<ul class="divide-y">
						{#each team.members as member (member.membership.userId)}
							<li class="flex items-center justify-between py-2">
								<div class="flex items-center gap-2">
									{#if member.user?.image}
										<img
											src={member.user.image}
											alt={member.user.name}
											class="h-6 w-6 rounded-full"
										/>
									{/if}
									<span class="text-sm font-medium">{member.user?.name ?? 'Unknown'}</span>
									{#if member.membership.isCaptain}
										<Badge variant="default" hoverEffects={false} class="text-xs">Captain</Badge>
									{/if}
								</div>
								<Badge variant="secondary" hoverEffects={false} class="text-xs">
									{member.membership.role}
								</Badge>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Status -->
				<div class="flex gap-2">
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
				</div>
			</Card.Content>
			<Card.Footer>
				<Button href="/home/team">
					{team.myMembership.isCaptain ? 'Manage Team' : 'View Team'}
				</Button>
			</Card.Footer>
		</Card.Root>

		<!-- Repositories Card -->
		{#if team.githubSlug}
			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between">
						<Card.Title>Repositories</Card.Title>
						<Badge variant="secondary" hoverEffects={false}>
							{reposQuery.data?.repos.length ?? 0}/3
						</Badge>
					</div>
					<Card.Description>Your team's GitHub repositories</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-col gap-2">
					{#if reposQuery.isLoading}
						<p class="text-muted-foreground text-sm">Loading repos...</p>
					{:else if reposQuery.data && reposQuery.data.repos.length > 0}
						{#each reposQuery.data.repos as repo (repo.id)}
							<div class="flex items-center justify-between rounded border px-3 py-2">
								<div class="flex flex-col">
									<span class="text-sm font-medium">{repo.name}</span>
									{#if repo.description}
										<span class="text-muted-foreground text-xs">{repo.description}</span>
									{/if}
								</div>
								<Button variant="outline" size="sm" href={repo.htmlUrl} target="_blank">
									View
								</Button>
							</div>
						{/each}
					{:else}
						<p class="text-muted-foreground text-sm italic">No repositories yet.</p>
					{/if}
				</Card.Content>
				<Card.Footer class="flex gap-2">
					<Button variant="outline" size="sm" href="/home/tickets">Create Repository</Button>
				</Card.Footer>
			</Card.Root>
		{/if}

		<!-- Tickets Card -->
		<Card.Root>
			<Card.Header>
				<div class="flex items-center justify-between">
					<Card.Title>Tickets</Card.Title>
					<Badge variant="secondary" hoverEffects={false}>
						{ticketsQuery.data?.tickets.length ?? 0}
					</Badge>
				</div>
				<Card.Description>Help requests from your team</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-col gap-2">
				{#if ticketsQuery.isLoading}
					<p class="text-muted-foreground text-sm">Loading tickets...</p>
				{:else if ticketsQuery.data && ticketsQuery.data.tickets.length > 0}
					{#each ticketsQuery.data.tickets.slice(0, 5) as ticket (ticket.id)}
						<div class="flex items-center justify-between rounded border px-3 py-2">
							<div class="flex items-center gap-2">
								<TicketStatusBadge status={ticket.resolutionStatus} />
								<span class="text-sm font-medium">{ticket.title}</span>
							</div>
							<a
								href={`https://github.com/${clientEnv.PUBLIC_GITHUB_ORGNAME}/${ticket.repository}/issues/${ticket.issueNumber}`}
								target="_blank"
								class="text-muted-foreground text-xs hover:underline"
							>
								{ticket.repository}#{ticket.issueNumber}
							</a>
						</div>
					{/each}
					{#if ticketsQuery.data.tickets.length > 5}
						<p class="text-muted-foreground text-center text-xs">
							+{ticketsQuery.data.tickets.length - 5} more
						</p>
					{/if}
				{:else}
					<p class="text-muted-foreground text-sm italic">No tickets yet.</p>
				{/if}
			</Card.Content>
			<Card.Footer>
				<Button href="/home/tickets">View All Tickets</Button>
			</Card.Footer>
		</Card.Root>
	{:else}
		<!-- No team -->
		<Card.Root>
			<Card.Header>
				<Card.Title>No Team Yet</Card.Title>
				<Card.Description>Create a team or join one using a join code.</Card.Description>
			</Card.Header>
			<Card.Content class="flex gap-3">
				<Button href="/home/create-team">Create a Team</Button>
				<Button variant="outline" href="/teams">Browse Teams</Button>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
