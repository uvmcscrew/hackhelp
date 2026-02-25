<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import type { RouterOutputs } from '$lib/orpc/server';

	type Props = {
		team: RouterOutputs['teams']['listAll'][number];
	};

	const { team }: Props = $props();

	const programmers = $derived(team.members.filter((m) => m.membership.role === 'programming'));
	const business = $derived(team.members.filter((m) => m.membership.role === 'business'));
</script>

<Card.Root>
	<Card.Header class="flex flex-row items-center justify-between">
		<div>
			<Card.Title>{team.name}</Card.Title>
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
	</Card.Header>
	<Card.Content class="flex flex-col gap-2">
		<div class="flex gap-4 text-sm">
			<span class="text-muted-foreground">Programming: {programmers.length}/5</span>
			<span class="text-muted-foreground">Business: {business.length}/2</span>
		</div>
		{#if team.members.length > 0}
			<div class="flex flex-wrap gap-1">
				{#each team.members as member (member.membership.userId)}
					<span class="bg-muted rounded px-2 py-0.5 text-xs">{member.user.name}</span>
				{/each}
			</div>
		{/if}
	</Card.Content>
	<Card.Footer>
		<Button variant="outline" size="sm" href={`/teams/${team.id}`}>View</Button>
	</Card.Footer>
</Card.Root>
