<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import * as Avatar from '$lib/components/ui/avatar';
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import Pencil from 'lucide-svelte/icons/pencil';
	import type { PageProps } from './$types';
	import UserWoTeamSearch from '../_components/user-wo-team-search.svelte';
	import {
		TEAM_MAX_SIZE,
		PROGRAMMERS_MIN,
		PROGRAMMERS_MAX,
		BUSINESS_MIN,
		BUSINESS_MAX
	} from '$lib/config/team-rules';

	let { data }: PageProps = $props();
	const qc = useQueryClient();

	// ── Queries ──
	const teamQuery = createQuery(() =>
		orpc.admin.teams.getById.queryOptions({
			input: { teamId: data.teamId }
		})
	);

	let members = $derived(teamQuery.data?.members || []);

	const programmers = $derived(members.filter((m) => m.membership.role === 'programming').length);
	const programmerCountCorrect = $derived(
		programmers >= PROGRAMMERS_MIN && programmers <= PROGRAMMERS_MAX
	);
	const businesspeople = $derived(members.filter((m) => m.membership.role === 'business').length);
	const businessCountCorrect = $derived(
		businesspeople >= BUSINESS_MIN && businesspeople <= BUSINESS_MAX
	);

	const invalidateTeam = () =>
		qc.invalidateQueries({
			queryKey: orpc.admin.teams.getById.queryOptions({ input: { teamId: data.teamId } }).queryKey
		});

	const invalidateAll = async () => {
		await invalidateTeam();
		await qc.invalidateQueries({ queryKey: orpc.admin.teams.all.queryKey() });
		await qc.invalidateQueries({ queryKey: orpc.admin.teams.usersWithoutTeam.queryKey() });
	};

	// ── Name editing ──
	let editingName = $state(false);
	let nameInput = $state('');

	const updateNameMut = createMutation(() =>
		orpc.admin.teams.updateName.mutationOptions({
			onSuccess: async () => {
				editingName = false;
				await invalidateAll();
			}
		})
	);

	function startEditName() {
		nameInput = teamQuery.data?.name ?? '';
		editingName = true;
	}

	function saveName() {
		if (!nameInput.trim()) return;
		updateNameMut.mutate({ teamId: data.teamId, name: nameInput.trim() });
	}

	// ── Member role/captain updates ──
	const updateMemberMut = createMutation(() =>
		orpc.admin.teams.updateMember.mutationOptions({ onSuccess: invalidateTeam })
	);

	// ── Remove member ──
	const removeMemberMut = createMutation(() =>
		orpc.admin.teams.removeMember.mutationOptions({ onSuccess: invalidateAll })
	);

	// ── Add member ──
	let addMemberUserId = $state('');
	let addMemberRole = $state<'business' | 'programming'>('programming');

	const addMemberMut = createMutation(() =>
		orpc.admin.teams.addMember.mutationOptions({
			onSuccess: async () => {
				addMemberUserId = '';
				await invalidateAll();
			}
		})
	);

	function handleAddMember() {
		if (!addMemberUserId) return;
		addMemberMut.mutate({
			teamId: data.teamId,
			userId: addMemberUserId,
			role: addMemberRole
		});
	}

	// ── Helpers ──
	function isMemberMutating(userId: string) {
		return (
			(updateMemberMut.isPending && updateMemberMut.variables.userId === userId) ||
			(removeMemberMut.isPending && removeMemberMut.variables.userId === userId)
		);
	}
</script>

<svelte:head>
	<title>{teamQuery.data?.name} | Team Administration</title>
</svelte:head>

<div class="container mx-auto max-w-2xl py-8">
	<Button variant="ghost" href="/admin/teams" class="mb-4 px-2">&larr; All Teams</Button>

	{#if teamQuery.isLoading}
		<p class="text-muted-foreground">Loading team...</p>
	{:else if teamQuery.isError}
		<Card.Root>
			<Card.Header>
				<Card.Title>Team Not Found</Card.Title>
				<Card.Description>This team doesn't exist or has been removed.</Card.Description>
			</Card.Header>
		</Card.Root>
	{:else if teamQuery.data}
		{@const team = teamQuery.data}

		<!-- Team Info Card -->
		<Card.Root class="mb-6">
			<Card.Header>
				<div class="flex items-center justify-between">
					{#if editingName}
						<div class="flex flex-1 items-center gap-2">
							<Input
								bind:value={nameInput}
								class="max-w-xs"
								minlength={3}
								maxlength={50}
								onkeydown={(e) => {
									if (e.key === 'Enter') saveName();
									if (e.key === 'Escape') editingName = false;
								}}
							/>
							<Button
								size="sm"
								onclick={saveName}
								disabled={updateNameMut.isPending || !nameInput.trim()}
							>
								Save
							</Button>
							<Button size="sm" variant="ghost" onclick={() => (editingName = false)}>
								Cancel
							</Button>
						</div>
					{:else}
						<div class="flex items-center gap-2">
							<Card.Title class="text-xl">{team.name}</Card.Title>
							<Button variant="ghost" size="icon" class="h-8 w-8" onclick={startEditName}>
								<Pencil class="h-4 w-4" />
							</Button>
						</div>
					{/if}
				</div>
				<Card.Description>
					{team.members.length}/{TEAM_MAX_SIZE} members &middot; Join code:
					<code class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">{team.joinCode}</code>
				</Card.Description>
			</Card.Header>
			<Card.Content
				><Badge
					variant={programmerCountCorrect && businessCountCorrect ? 'green' : 'secondary'}
					hoverEffects={false}
				>
					{team.members.length}/{TEAM_MAX_SIZE} members
				</Badge>
				<Badge variant={programmerCountCorrect ? 'green' : 'destructive'} hoverEffects={false}>
					{programmers}/{PROGRAMMERS_MAX} programmers
				</Badge>
				<Badge variant={businessCountCorrect ? 'green' : 'destructive'} hoverEffects={false}>
					{businesspeople}/{BUSINESS_MAX} businesspeople
				</Badge>
				<Badge variant={businessCountCorrect ? 'green' : 'destructive'} hoverEffects={false}>
					{businesspeople}/2 businesspeople
				</Badge></Card.Content
			>
		</Card.Root>

		{#if updateNameMut.isError}
			<p class="text-destructive mb-4 text-sm">{updateNameMut.error.message}</p>
		{/if}

		<!-- Members Table -->
		<Card.Root class="mb-6">
			<Card.Header>
				<Card.Title class="text-base">Members</Card.Title>
			</Card.Header>
			<Card.Content class="">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>User</Table.Head>
							<Table.Head>Role</Table.Head>
							<Table.Head>Captain</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each team.members as member (member.user.id)}
							{@const pending = isMemberMutating(member.user.id)}
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Avatar.Root class="h-8 w-8">
											<Avatar.Image src={member.user.image} alt={member.user.name ?? ''} />
											<Avatar.Fallback>
												<CircleUser class="h-4 w-4" />
											</Avatar.Fallback>
										</Avatar.Root>
										<div class="flex flex-col">
											<span class="text-sm font-medium">{member.user.name || 'Unnamed'}</span>
											<span class="text-muted-foreground text-xs">{member.user.email}</span>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Select.Root
										type="single"
										value={member.membership.role}
										onValueChange={(v) => {
											if (v === 'business' || v === 'programming') {
												updateMemberMut.mutate({
													teamId: data.teamId,
													userId: member.user.id,
													role: v
												});
											}
										}}
										disabled={pending}
									>
										<Select.Trigger class="h-8 w-[130px]">
											{member.membership.role === 'programming' ? 'Programming' : 'Business'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="programming">Programming</Select.Item>
											<Select.Item value="business">Business</Select.Item>
										</Select.Content>
									</Select.Root>
								</Table.Cell>
								<Table.Cell>
									{#if member.membership.isCaptain}
										<Badge variant="default">Captain</Badge>
									{:else}
										<Button
											variant="outline"
											size="sm"
											disabled={pending}
											onclick={() => {
												if (
													confirm(
														`Make ${member.user.name || member.user.email} the new captain? The current captain will be demoted.`
													)
												) {
													updateMemberMut.mutate({
														teamId: data.teamId,
														userId: member.user.id,
														isCaptain: true
													});
												}
											}}
										>
											Make Captain
										</Button>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right">
									<Button
										variant="destructive"
										size="sm"
										disabled={pending}
										onclick={() => {
											if (
												confirm(`Remove ${member.user.name || member.user.email} from the team?`)
											) {
												removeMemberMut.mutate({
													teamId: data.teamId,
													userId: member.user.id
												});
											}
										}}
									>
										Remove
									</Button>
								</Table.Cell>
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={4} class="py-4 text-center">No members.</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>

		{#if removeMemberMut.isError}
			<p class="text-destructive mb-4 text-sm">{removeMemberMut.error.message}</p>
		{/if}
		{#if updateMemberMut.isError}
			<p class="text-destructive mb-4 text-sm">{updateMemberMut.error.message}</p>
		{/if}

		<!-- Add Member Section -->
		{#if team.members.length < TEAM_MAX_SIZE}
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">Add Member</Card.Title>
					<Card.Description>Add a user who is not currently on any team.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="flex flex-col gap-4 sm:flex-row sm:items-end">
						<!-- User combobox -->
						<div class="flex-1 space-y-2">
							<Label>User</Label>
							<UserWoTeamSearch bind:selectedUserId={addMemberUserId} />
						</div>

						<!-- Role -->
						<div class="w-36 space-y-2">
							<Label>Role</Label>
							<Select.Root
								type="single"
								value={addMemberRole}
								onValueChange={(v) => {
									if (v === 'business' || v === 'programming') addMemberRole = v;
								}}
							>
								<Select.Trigger class="w-full">
									{addMemberRole === 'programming' ? 'Programming' : 'Business'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="programming">Programming</Select.Item>
									<Select.Item value="business">Business</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>

						<Button onclick={handleAddMember} disabled={!addMemberUserId || addMemberMut.isPending}>
							{addMemberMut.isPending ? 'Adding...' : 'Add'}
						</Button>
					</div>

					{#if addMemberMut.isError}
						<p class="text-destructive mt-2 text-sm">{addMemberMut.error.message}</p>
					{/if}
				</Card.Content>
			</Card.Root>
		{/if}
	{/if}
</div>
