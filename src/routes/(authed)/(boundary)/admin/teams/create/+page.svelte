<script lang="ts">
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';

	import UserWoTeamSearch from '../_components/user-wo-team-search.svelte';

	const qc = useQueryClient();

	let teamName = $state('');
	let captainUserId = $state('');
	let captainRole = $state<'business' | 'programming'>('programming');

	const createMut = createMutation(() =>
		orpc.admin.teams.create.mutationOptions({
			onSuccess: async (data) => {
				await qc.invalidateQueries({ queryKey: orpc.admin.teams.all.queryOptions().queryKey });
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				await goto(`/admin/teams/${data.id}`);
			}
		})
	);

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!teamName.trim() || !captainUserId) return;
		createMut.mutate({
			name: teamName.trim(),
			captainUserId,
			captainRole
		});
	}
</script>

<svelte:head>
	<title>Create a Team - Admin | HackHelp</title>
</svelte:head>

<div class="container mx-auto max-w-lg py-8">
	<Button variant="ghost" href="/admin/teams" class="mb-4 px-2">&larr; All Teams</Button>

	<Card.Root>
		<Card.Header>
			<Card.Title>Create Team</Card.Title>
			<Card.Description>Create a new team and assign a captain.</Card.Description>
		</Card.Header>
		<Card.Content>
			<form onsubmit={handleSubmit} class="space-y-6">
				<!-- Team name -->
				<div class="space-y-2">
					<Label for="team-name">Team Name</Label>
					<Input
						id="team-name"
						placeholder="Enter team name"
						bind:value={teamName}
						minlength={3}
						maxlength={50}
						required
					/>
				</div>

				<!-- Captain selector (combobox) -->
				<div class="space-y-2">
					<Label>Captain</Label>
					<UserWoTeamSearch bind:selectedUserId={captainUserId} />
				</div>

				<!-- Captain role -->
				<div class="space-y-2">
					<Label>Captain Role</Label>
					<Select.Root
						type="single"
						value={captainRole}
						onValueChange={(v) => {
							if (v === 'business' || v === 'programming') captainRole = v;
						}}
					>
						<Select.Trigger class="w-full">
							{captainRole === 'programming' ? 'Programming' : 'Business'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="programming">Programming</Select.Item>
							<Select.Item value="business">Business</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				{#if createMut.isError}
					<p class="text-destructive text-sm">{createMut.error.message}</p>
				{/if}

				<Button
					type="submit"
					class="w-full"
					disabled={!teamName.trim() || !captainUserId || createMut.isPending}
				>
					{createMut.isPending ? 'Creating...' : 'Create Team'}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
