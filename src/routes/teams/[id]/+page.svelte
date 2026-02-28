<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const teamQuery = createQuery(() =>
		orpc.teams.byId.queryOptions({
			input: { id: data.teamId }
		})
	);
</script>

{#if teamQuery.data}
	{@const team = teamQuery.data}

	<!-- Location Info -->
	{#if team.room || team.locationDescription}
		<Card.Root class="mb-4">
			<Card.Content class="flex items-center gap-2 py-3">
				<MapPin class="text-muted-foreground h-4 w-4 shrink-0" />
				<span class="text-sm">
					{#if team.room}<span class="font-medium">Room {team.room}</span>{/if}
					{#if team.room && team.locationDescription}
						&middot;
					{/if}
					{#if team.locationDescription}<span class="text-muted-foreground"
							>{team.locationDescription}</span
						>{/if}
				</span>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Members List -->
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between">
			<Card.Title>Members</Card.Title>
			{#if team.canJoin}
				<Button variant="outline" size="sm" href={`/teams/${team.id}/join`}>Join Team</Button>
			{/if}
		</Card.Header>
		<Card.Content>
			{#if team.members.length === 0}
				<p class="text-muted-foreground text-sm">No members yet.</p>
			{:else}
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
									{#if member.user?.email}
										<span class="text-muted-foreground text-xs">
											{member.user.email}
										</span>
									{/if}
								</div>
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
			{/if}
		</Card.Content>
	</Card.Root>
{/if}
