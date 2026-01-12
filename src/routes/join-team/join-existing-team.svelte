<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label';
	import { orpc } from '$lib/orpc/client/index.svelte';
	import { createMutation } from '@tanstack/svelte-query';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';

	let teamJoinCode = $state('');

	const joinTeamMutation = createMutation(orpc.competitor.team.joinTeamMutation.mutationOptions);

	async function joinTeam() {
		await joinTeamMutation.mutateAsync({ teamJoinCode });
		await goto(resolve('/home'));
	}
</script>

<Card.Root class="h-full w-full">
	<Card.Header>
		<Card.Title>Join an existing team</Card.Title>
	</Card.Header>
	<Card.Content class="flex gap-x-2">
		<span class="flex w-full max-w-sm flex-col gap-1.5">
			<Label for="teamJoinCode">Team Join Code</Label>
			<Input
				id="teamJoinCode"
				bind:value={teamJoinCode}
				disabled={joinTeamMutation.isPending}
				minlength={6}
				maxlength={6}
			/>
		</span>
		<Button disabled={joinTeamMutation.isPending} onclick={joinTeam} class="mt-auto"
			>{#if joinTeamMutation.isPending}
				Joining... <LoaderCircle class="h-6 w-6 animate-spin" />
			{:else}
				Join Team
			{/if}
		</Button>
	</Card.Content>
</Card.Root>
