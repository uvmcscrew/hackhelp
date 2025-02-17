<script>
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Label } from '$lib/components/ui/label';

	let teamId = $state('');
</script>

<Card.Root class="h-full w-full">
	<Card.Header>
		<Card.Title>Join an existing team</Card.Title>
	</Card.Header>
	<Card.Content class="flex gap-x-2">
		<span class="flex w-full max-w-sm flex-col gap-1.5">
			<Label for="teamId">Team Join Code</Label>
			<Input id="teamId" bind:value={teamId} minlength={6} maxlength={6} />
		</span>
		<Button class="mt-auto">Join</Button>
	</Card.Content>
</Card.Root>
