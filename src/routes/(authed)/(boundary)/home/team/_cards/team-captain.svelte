<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import type { RouterOutputs } from '$lib/orpc/server';
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';

	type Props = {
		team: NonNullable<RouterOutputs['teams']['myTeam']>;
	};

	let { team }: Props = $props();

	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: orpc.teams.myTeam.queryKey() });

	// Captain mutations
	const toggleCanJoinMut = createMutation(() =>
		orpc.teams.toggleCanJoin.mutationOptions({ onSuccess: invalidate })
	);
	const toggleIsPublicMut = createMutation(() =>
		orpc.teams.toggleIsPublic.mutationOptions({ onSuccess: invalidate })
	);
	const transferCaptainMut = createMutation(() =>
		orpc.teams.transferCaptain.mutationOptions({ onSuccess: invalidate })
	);

	// Transfer captain state
	const otherMembers = $derived(
		team.members.filter((m) => m.user && m.user.id !== team.myMembership.userId)
	);
	let transferTargetId = $state('');

	function handleTransfer() {
		if (!transferTargetId) return;
		if (confirm('Are you sure you want to transfer captaincy? You will lose captain privileges.')) {
			transferCaptainMut.mutate({ targetUserId: transferTargetId });
		}
	}
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

		{#if otherMembers.length > 0}
			<Separator />

			<div class="flex flex-col gap-2">
				<div class="flex flex-col gap-0.5">
					<span class="text-sm font-medium">Transfer Captaincy</span>
					<span class="text-muted-foreground text-xs">
						Hand over captain privileges to another team member.
					</span>
				</div>
				<div class="flex items-center gap-2">
					<Select.Root
						type="single"
						value={transferTargetId}
						onValueChange={(v) => {
							if (v) transferTargetId = v;
						}}
					>
						<Select.Trigger class="h-8 w-[200px]">
							{#if transferTargetId}
								{@const target = otherMembers.find((m) => m.user?.id === transferTargetId)}
								{target?.user?.name || 'Select member'}
							{:else}
								Select member...
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each otherMembers as member (member.user?.id)}
								{#if member.user}
									<Select.Item value={member.user.id}>
										{member.user.name || member.user.email}
									</Select.Item>
								{/if}
							{/each}
						</Select.Content>
					</Select.Root>
					<Button
						variant="destructive"
						size="sm"
						onclick={handleTransfer}
						disabled={!transferTargetId || transferCaptainMut.isPending}
					>
						{transferCaptainMut.isPending ? 'Transferring...' : 'Transfer'}
					</Button>
				</div>
				{#if transferCaptainMut.isError}
					<p class="text-destructive text-xs">{transferCaptainMut.error.message}</p>
				{/if}
			</div>
		{/if}
	</Card.Content>
</Card.Root>
