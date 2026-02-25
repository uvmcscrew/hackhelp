<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { RouterOutputs } from '$lib/orpc/server';

	type Props = {
		team: NonNullable<RouterOutputs['teams']['myTeam']>;
	};

	let { team }: Props = $props();

	const isCaptain = $derived(team.myMembership.isCaptain);

	const programmers = $derived(team.members.filter((m) => m.membership.role === 'programming'));
	const programmerCountCorrect = $derived(programmers.length >= 4 && programmers.length <= 5);
	const business = $derived(team.members.filter((m) => m.membership.role === 'business'));
	const businessCountCorrect = $derived(business.length >= 1 && business.length <= 2);

	function copyJoinCode(code: string) {
		void navigator.clipboard.writeText(code);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	let copied = $state(false);
</script>

<Card.Root>
	<Card.Header>
		<div class="flex items-center justify-between">
			<Card.Title class="text-xl">{team.name}</Card.Title>
			<div class="flex gap-2">
				{#if isCaptain}
					<Badge variant="default">Captain</Badge>
				{/if}
				<Badge variant="secondary">{team.myMembership.role}</Badge>
			</div>
		</div>
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
				{team.members.length}/7 members
			</Badge>
			<Badge variant={programmerCountCorrect ? 'green' : 'destructive'} hoverEffects={false}>
				{programmers.length}/5 programmers
			</Badge>
			<Badge variant={businessCountCorrect ? 'green' : 'destructive'} hoverEffects={false}>
				{business.length}/2 business
			</Badge>
		</div>
	</Card.Content>
</Card.Root>
