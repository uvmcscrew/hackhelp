<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { createMutation } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { goto } from '$app/navigation';

	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();

	let selectedRole = $state<'business' | 'programming' | undefined>(undefined);
	let errorMessage = $state('');

	const joinMutation = createMutation(() =>
		orpc.teams.join.mutationOptions({
			onSuccess: () => {
				void goto(resolve(`/(authed)/home/team`));
			},
			onError: (err) => {
				errorMessage = err.message || 'Failed to join team';
			}
		})
	);

	function handleJoin() {
		if (!selectedRole) {
			errorMessage = 'Please select a role';
			return;
		}
		errorMessage = '';
		joinMutation.mutate({
			joinCode: data.team.joinCode,
			asRole: selectedRole
		});
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Join {data.team.name}</Card.Title>
		<Card.Description>Select your role to join this team.</Card.Description>
	</Card.Header>
	<Card.Content class="flex flex-col gap-4">
		<div class="flex flex-col gap-2">
			<Label for="role-select">Role</Label>
			<Select.Root type="single" onValueChange={(v) => (selectedRole = v as typeof selectedRole)}>
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
	</Card.Content>
	<Card.Footer>
		<Button onclick={handleJoin} disabled={joinMutation.isPending || !selectedRole}>
			{#if joinMutation.isPending}
				Joining...
			{:else}
				Join Team
			{/if}
		</Button>
	</Card.Footer>
</Card.Root>
