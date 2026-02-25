<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import NoTeamCard from './_cards/no-team-card.svelte';
	import TeamInfo from './_cards/team-info.svelte';
	import TeamMembers from './_cards/team-members.svelte';
	import TeamCaptain from './_cards/team-captain.svelte';
	import * as Tabs from '$lib/components/ui/tabs';

	const queryClient = useQueryClient();
	const myTeamQuery = createQuery(() => orpc.teams.myTeam.queryOptions());

	const leaveTeamMut = createMutation(() =>
		orpc.teams.leaveTeam.mutationOptions({
			onSuccess: async (_) => {
				await queryClient.cancelQueries({ queryKey: orpc.teams.myTeam.queryKey() });
				await goto(resolve('/(authed)/home'));
			}
		})
	);

	let confirmLeave = $state(false);

	function handleLeave() {
		if (confirmLeave) {
			leaveTeamMut.mutate({});
		} else {
			confirmLeave = true;
		}
	}
</script>

<div class="container mx-auto flex max-w-2xl flex-col gap-6 py-8">
	<div class="flex items-center gap-3">
		<h1 class="text-2xl font-bold">My Team</h1>
	</div>

	{#if myTeamQuery.isLoading}
		<p class="text-muted-foreground">Loading...</p>
	{:else if !myTeamQuery.data}
		<NoTeamCard />
	{:else}
		{@const team = myTeamQuery.data}
		{@const isCaptain = team.myMembership.isCaptain}
		<!-- Team Info Card -->
		<TeamInfo {team} />

		<Tabs.Root value="members">
			<Tabs.List>
				<Tabs.Trigger value="members">Members</Tabs.Trigger>
				<Tabs.Trigger value="captain">Captain Controls</Tabs.Trigger>
				<Tabs.Trigger value="danger">Danger Zone</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="members"
				><TeamMembers members={team.members} me={team.myMembership} /></Tabs.Content
			>

			{#if isCaptain}
				<Tabs.Content value="captain">
					<TeamCaptain {team} />
				</Tabs.Content>
			{/if}

			<Tabs.Content value="danger"
				><Card.Root class="border-destructive/50">
					<Card.Header>
						<Card.Title>Leave Team</Card.Title>
						<Card.Description>
							{#if isCaptain}
								As captain, you can only leave if you're the last member. This will delete the team.
							{:else}
								Leave this team. You can join another team afterwards.
							{/if}
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<Button
							variant={confirmLeave ? 'destructive' : 'outline'}
							onclick={handleLeave}
							disabled={leaveTeamMut.isPending}
						>
							{#if leaveTeamMut.isPending}
								Leaving...
							{:else if confirmLeave}
								Are you sure? Click again to confirm
							{:else if isCaptain}
								Delete Team
							{:else}
								Leave Team
							{/if}
						</Button>
					</Card.Content>
				</Card.Root></Tabs.Content
			>
		</Tabs.Root>
	{/if}
</div>
