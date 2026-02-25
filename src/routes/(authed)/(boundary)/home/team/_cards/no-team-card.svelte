<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
</script>

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
