<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { createQuery, createMutation } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const teamQuery = createQuery(() =>
		orpc.teams.byId.queryOptions({
			input: { id: data.teamId }
		})
	);

	let joinCode = $state('');
	let selectedRole = $state<'business' | 'programming' | undefined>(undefined);
	let errorMessage = $state('');

	const joinMutation = createMutation(() =>
		orpc.teams.join.mutationOptions({
			onSuccess: () => {
				void goto('/home/team');
			},
			onError: (err) => {
				errorMessage = err.message || 'Failed to join team';
			}
		})
	);

	function handleJoin() {
		if (!joinCode || joinCode.length !== 6) {
			errorMessage = 'Please enter a valid 6-character join code';
			return;
		}
		if (!selectedRole) {
			errorMessage = 'Please select a role';
			return;
		}
		errorMessage = '';
		joinMutation.mutate({
			joinCode: joinCode.toLowerCase(),
			asRole: selectedRole
		});
	}
</script>

{#if teamQuery.data}
	{@const team = teamQuery.data}

	<Card.Root>
		<Card.Header>
			<Card.Title>Join {team.name}</Card.Title>
			<Card.Description>Enter the team's join code and select your role to join.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			{#if !team.canJoin}
				<p class="text-destructive text-sm">This team is not currently accepting new members.</p>
			{:else}
				<div class="flex flex-col gap-2">
					<Label for="join-code">Join Code</Label>
					<Input
						id="join-code"
						placeholder="e.g. a1b2c3"
						bind:value={joinCode}
						maxlength={6}
						class="font-mono tracking-widest"
					/>
				</div>

				<div class="flex flex-col gap-2">
					<Label for="role-select">Your Role</Label>
					<Select.Root
						type="single"
						onValueChange={(v) => (selectedRole = v as typeof selectedRole)}
					>
						<Select.Trigger id="role-select">
							{#if selectedRole === 'programming'}
								Programming
							{:else if selectedRole === 'business'}
								Business
							{:else}
								Select a role...
							{/if}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="programming">Programming</Select.Item>
							<Select.Item value="business">Business</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				{#if errorMessage}
					<p class="text-destructive text-sm">{errorMessage}</p>
				{/if}
			{/if}
		</Card.Content>
		{#if team.canJoin}
			<Card.Footer>
				<Button
					onclick={handleJoin}
					disabled={joinMutation.isPending || !selectedRole || joinCode.length !== 6}
				>
					{#if joinMutation.isPending}
						Joining...
					{:else}
						Join Team
					{/if}
				</Button>
			</Card.Footer>
		{/if}
	</Card.Root>
{/if}
