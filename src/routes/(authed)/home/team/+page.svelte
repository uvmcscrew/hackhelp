<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	const queryClient = useQueryClient();
	const myTeamQuery = createQuery(() => orpc.teams.myTeam.queryOptions());

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
	const kickMemberMut = createMutation(() =>
		orpc.teams.kickMember.mutationOptions({
			onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.teams.myTeam.queryKey() })
		})
	);
	const leaveTeamMut = createMutation(() =>
		orpc.teams.leaveTeam.mutationOptions({
			onSuccess: async (_) => {
				await queryClient.cancelQueries({ queryKey: orpc.teams.myTeam.queryKey() });
				await goto(resolve('/(authed)/home'));
			}
		})
	);

	let confirmLeave = $state(false);
	let confirmKickUserId = $state<string | null>(null);

	function handleKick(userId: string) {
		if (confirmKickUserId === userId) {
			kickMemberMut.mutate({ userId });
			confirmKickUserId = null;
		} else {
			confirmKickUserId = userId;
		}
	}

	function handleLeave() {
		if (confirmLeave) {
			leaveTeamMut.mutate({});
		} else {
			confirmLeave = true;
		}
	}

	function copyJoinCode(code: string) {
		void navigator.clipboard.writeText(code);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	let copied = $state(false);
</script>

<div class="container mx-auto flex max-w-2xl flex-col gap-6 py-8">
	<div class="flex items-center gap-3">
		<Button variant="ghost" href="/home" class="px-2">&larr; Back</Button>
		<h1 class="text-2xl font-bold">My Team</h1>
	</div>

	{#if myTeamQuery.isLoading}
		<p class="text-muted-foreground">Loading...</p>
	{:else if !myTeamQuery.data}
		<Card.Root>
			<Card.Header>
				<Card.Title>No Team</Card.Title>
				<Card.Description>You're not part of a team yet.</Card.Description>
			</Card.Header>
			<Card.Content class="flex gap-3">
				<Button href="/home/create-team">Create a Team</Button>
				<Button variant="outline" href="/teams">Browse Teams</Button>
			</Card.Content>
		</Card.Root>
	{:else}
		{@const team = myTeamQuery.data}
		{@const isCaptain = team.myMembership.isCaptain}
		{@const programmers = team.members.filter((m) => m.membership.role === 'programming')}
		{@const business = team.members.filter((m) => m.membership.role === 'business')}

		<!-- Team Info Card -->
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
					<Badge variant="secondary" hoverEffects={false}>
						{team.members.length}/7 members
					</Badge>
					<Badge variant="secondary" hoverEffects={false}>
						{programmers.length}/5 programmers
					</Badge>
					<Badge variant="secondary" hoverEffects={false}>
						{business.length}/2 business
					</Badge>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Members Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Members</Card.Title>
			</Card.Header>
			<Card.Content>
				<ul class="flex flex-col">
					{#each team.members as member, i (member.membership.userId)}
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
								{#if isCaptain && member.membership.userId !== team.myMembership.userId}
									<Button
										variant={confirmKickUserId === member.membership.userId
											? 'destructive'
											: 'ghost'}
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

		<!-- Captain Controls -->
		{#if isCaptain}
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
							onclick={() => toggleCanJoinMut.mutate()}
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
							onclick={() => toggleIsPublicMut.mutate()}
							disabled={toggleIsPublicMut.isPending}
						>
							{team.isPublic ? 'Make Private' : 'Make Public'}
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Leave Team -->
		<Card.Root class="border-destructive/50">
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
		</Card.Root>
	{/if}
</div>
