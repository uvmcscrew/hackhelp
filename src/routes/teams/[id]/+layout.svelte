<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { sessionQueryOptions } from '$lib/auth/client.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import UserDropdown from '$lib/components/UserDropdown.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const session = createQuery(() => sessionQueryOptions);

	const teamQuery = createQuery(() =>
		orpc.teams.byId.queryOptions({
			input: { id: data.teamId }
		})
	);

	const programmers = $derived(
		teamQuery.data?.members.filter((m) => m.teamMember.role === 'programming') ?? []
	);
	const business = $derived(
		teamQuery.data?.members.filter((m) => m.teamMember.role === 'business') ?? []
	);
</script>

<div class="container mx-auto max-w-2xl py-8">
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<Button variant="ghost" href="/teams" class="mb-2 px-2">&larr; All Teams</Button>
			{#if session.data}
				<UserDropdown />
			{/if}
		</div>

		{#if teamQuery.isLoading}
			<p class="text-muted-foreground">Loading team...</p>
		{:else if teamQuery.isError}
			<Card.Root>
				<Card.Header>
					<Card.Title>Team Not Found</Card.Title>
					<Card.Description>This team doesn't exist or has been removed.</Card.Description>
				</Card.Header>
				<Card.Content>
					<Button href="/teams">Browse Teams</Button>
				</Card.Content>
			</Card.Root>
		{:else if teamQuery.data}
			{@const team = teamQuery.data}

			<!-- Shared header -->
			<Card.Root class="mb-6">
				<Card.Header>
					<div class="flex items-center justify-between">
						<div>
							<Card.Title class="text-xl">{team.name}</Card.Title>
							<Card.Description>
								{team.members.length}/7 members
							</Card.Description>
						</div>
						<div class="flex gap-1">
							{#if team.canJoin}
								<Badge variant="green" hoverEffects={false}>Open</Badge>
							{:else}
								<Badge variant="secondary" hoverEffects={false}>Closed</Badge>
							{/if}
						</div>
					</div>
				</Card.Header>
				<Card.Content>
					<div class="flex gap-4 text-sm">
						<span class="text-muted-foreground">
							Programming: {programmers.length}/5
						</span>
						<span class="text-muted-foreground">
							Business: {business.length}/2
						</span>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Child page content -->
			{@render children()}
		{/if}
	</div>
</div>
