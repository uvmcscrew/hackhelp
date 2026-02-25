<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import type { RouterOutputs } from '$lib/orpc/server';
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';

	type Props = {
		team: NonNullable<RouterOutputs['teams']['myTeam']>;
	};

	let { team }: Props = $props();

	const queryClient = useQueryClient();

	// Captain mutations
	const toggleCanJoinMut = createMutation(() =>
		orpc.teams.toggleCanJoin.mutationOptions({
			onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.teams.myTeam.queryKey() })
		})
	);
	const toggleIsPublicMut = createMutation(() =>
		orpc.teams.toggleIsPublic.mutationOptions({
			onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.teams.myTeam.queryKey() })
		})
	);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Team Settings</Card.Title>
		<Card.Description>Manage your team's settings as captain.</Card.Description>
	</Card.Header>
	<Card.Content class="flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<div class="flex flex-col gap-0.5">
				<span class="text-sm font-medium">Allow Joining</span>
				<span class="text-muted-foreground text-xs">
					{team.canJoin ? 'Members can join with the join code.' : 'No new members can join.'}
				</span>
			</div>
			<Button
				variant="outline"
				size="sm"
				onclick={() => toggleCanJoinMut.mutate({})}
				disabled={toggleCanJoinMut.isPending}
			>
				{team.canJoin ? 'Close' : 'Open'}
			</Button>
		</div>

		<Separator />

		<div class="flex items-center justify-between">
			<div class="flex flex-col gap-0.5">
				<span class="text-sm font-medium">Public Visibility</span>
				<span class="text-muted-foreground text-xs">
					{team.isPublic
						? 'Your team is visible on the teams page.'
						: 'Your team is hidden from the teams page.'}
				</span>
			</div>
			<Button
				variant="outline"
				size="sm"
				onclick={() => toggleIsPublicMut.mutate({})}
				disabled={toggleIsPublicMut.isPending}
			>
				{team.isPublic ? 'Make Private' : 'Make Public'}
			</Button>
		</div>
	</Card.Content>
</Card.Root>
