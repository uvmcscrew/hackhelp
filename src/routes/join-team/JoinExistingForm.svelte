<script>
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label';
	import mutations from '$lib/trpc/client/mutations.svelte';

	let teamJoinCode = $state('');

	const joinTeamMutation = mutations.competitorJoinTeam();

	async function joinTeam() {
		await $joinTeamMutation.mutateAsync({ teamJoinCode });
		await goto('/home');
	}
</script>

<Card.Root class="h-full w-full">
	<Card.Header>
		<Card.Title>Join an existing team</Card.Title>
	</Card.Header>
	<Card.Content class="flex gap-x-2">
		<span class="flex w-full max-w-sm flex-col gap-1.5">
			<Label for="teamJoinCode">Team Join Code</Label>
			<Input id="teamJoinCode" bind:value={teamJoinCode} minlength={6} maxlength={6} />
		</span>
		<Button disabled={$joinTeamMutation.isPending} class="mt-auto">Join</Button>
	</Card.Content>
</Card.Root>
