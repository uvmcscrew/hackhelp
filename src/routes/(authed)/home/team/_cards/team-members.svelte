<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import type { RouterOutputs } from '$lib/orpc/server';
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';

	type Props = {
		members: NonNullable<RouterOutputs['teams']['myTeam']>['members'];
		me: NonNullable<RouterOutputs['teams']['myTeam']>['myMembership'];
	};

	let { members, me }: Props = $props();

	const queryClient = useQueryClient();

	const isCaptain = $derived(me.isCaptain);

	let confirmKickUserId = $state<string | null>(null);

	const kickMemberMut = createMutation(() =>
		orpc.teams.kickMember.mutationOptions({
			onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.teams.myTeam.queryKey() })
		})
	);

	function handleKick(userId: string) {
		if (confirmKickUserId === userId) {
			kickMemberMut.mutate({ userId });
			confirmKickUserId = null;
		} else {
			confirmKickUserId = userId;
		}
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Members</Card.Title>
	</Card.Header>
	<Card.Content>
		<ul class="flex flex-col">
			{#each members as member, i (member.membership.userId)}
				{#if i > 0}
					<Separator />
				{/if}
				<li class="flex items-center justify-between py-3">
					<div class="flex items-center gap-3">
						<Avatar.Root class="h-8 w-8">
							{#if member.user?.image}
								<Avatar.Image src={member.user.image} alt={member.user.name ?? ''} />
							{/if}
							<Avatar.Fallback>
								{(member.user?.name ?? '?').charAt(0).toUpperCase()}
							</Avatar.Fallback>
						</Avatar.Root>
						<div class="flex flex-col">
							<span class="text-sm font-medium">
								{member.user?.name ?? 'Unknown'}
							</span>
							<span class="text-muted-foreground text-xs">
								{member.user?.email ?? ''}
							</span>
						</div>
						{#if member.membership.isCaptain}
							<Badge variant="default" hoverEffects={false} class="text-xs">Captain</Badge>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						<Badge variant="secondary" hoverEffects={false} class="text-xs">
							{member.membership.role}
						</Badge>
						{#if isCaptain && member.membership.userId !== me.userId}
							<Button
								variant={confirmKickUserId === member.membership.userId ? 'destructive' : 'ghost'}
								size="sm"
								onclick={() => handleKick(member.membership.userId)}
								disabled={kickMemberMut.isPending}
							>
								{#if confirmKickUserId === member.membership.userId}
									Confirm?
								{:else}
									Kick
								{/if}
							</Button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</Card.Content>
</Card.Root>
