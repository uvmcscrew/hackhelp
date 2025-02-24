<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
</script>

<Card.Card class="col-span-1 col-start-1 row-span-1 row-start-1">
	<Card.Header class="flex flex-row items-center justify-between">
		<Card.Title class="h-full">Ticket Status</Card.Title>
	</Card.Header>
	<Card.Content>
		<h2 class="font-sans text-5xl font-semibold">9</h2>
		<p class="text-muted-foreground text-sm">Tickets not assigned to mentors</p>
	</Card.Content>
	<Card.Footer><Button size="default">View Whitelist</Button></Card.Footer>
</Card.Card>
