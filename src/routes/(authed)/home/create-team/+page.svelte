<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { createMutation } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let teamName = $state('');
	let selectedRole = $state<'business' | 'programming' | undefined>(undefined);
	let errorMessage = $state('');

	const createMut = createMutation(() =>
		orpc.teams.create.mutationOptions({
			onSuccess: async () => {
				await goto(resolve('/(authed)/home/team'));
			},
			onError: (err) => {
				errorMessage = err.message || 'Failed to create team';
			}
		})
	);

	function handleCreate() {
		if (!teamName || teamName.length < 3) {
			errorMessage = 'Team name must be at least 3 characters';
			return;
		}
		if (!selectedRole) {
			errorMessage = 'Please select your role';
			return;
		}
		errorMessage = '';
		createMut.mutate({ name: teamName, asRole: selectedRole });
	}
</script>

<div class="flex min-h-[calc(100vh-4rem)] items-start justify-center pt-16">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title>Create a Team</Card.Title>
			<Card.Description>
				You'll be the team captain. Share the join code with your teammates.
			</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<Label for="team-name">Team Name</Label>
				<Input id="team-name" placeholder="My Awesome Team" bind:value={teamName} maxlength={50} />
			</div>

			<div class="flex flex-col gap-2">
				<Label for="role-select">Your Role</Label>
				<Select.Root type="single" onValueChange={(v) => (selectedRole = v as typeof selectedRole)}>
					<Select.Trigger id="role-select">
						{#if selectedRole === 'programming'}
							Programming
						{:else if selectedRole === 'business'}
							Business
						{:else}
							Select your role...
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
		</Card.Content>
		<Card.Footer class="flex justify-between">
			<Button variant="outline" href="/home">Cancel</Button>
			<Button onclick={handleCreate} disabled={createMut.isPending}>
				{#if createMut.isPending}
					Creating...
				{:else}
					Create Team
				{/if}
			</Button>
		</Card.Footer>
	</Card.Root>
</div>
