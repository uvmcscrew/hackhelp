<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	const myTeamQuery = createQuery(() => orpc.teams.myTeam.queryOptions());
</script>

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
						Members ({team.members.length}/7)
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
